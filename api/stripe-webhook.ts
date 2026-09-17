import type { VercelRequest, VercelResponse } from '@vercel/node'
import type Stripe from 'stripe'
import { stripeAdmin } from '../server/stripeAdmin'
import { supabaseAdmin } from '../server/supabaseAdmin'
import { monthsUntil, nextCarnaval } from '../src/lib/pricing'

// Precisa do corpo cru pra verificar a assinatura do Stripe — desliga
// o parser automático do Vercel.
export const config = {
  api: { bodyParser: false },
}

function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || typeof sig !== 'string' || !webhookSecret) {
    res.status(400).send('Missing signature or webhook secret')
    return
  }

  const stripe = stripeAdmin()
  let event: Stripe.Event

  try {
    const raw = await readRawBody(req)
    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed', err)
    res.status(400).send(`Webhook Error: ${(err as Error).message}`)
    return
  }

  const admin = supabaseAdmin()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const blocoSlug = session.metadata?.blocoSlug

    if (blocoSlug) {
      const months = Number(session.metadata?.months ?? monthsUntil(nextCarnaval()))
      const paidUntil =
        session.mode === 'subscription'
          ? null // assinatura: fica ativo enquanto a cobrança recorrente estiver em dia
          : new Date(Date.now() + months * 30 * 86_400_000).toISOString()

      const { error } = await admin
        .from('blocos')
        .update({
          status: 'active',
          plan: session.mode === 'subscription' ? 'monthly' : 'lump_sum',
          stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
          stripe_subscription_id:
            typeof session.subscription === 'string' ? session.subscription : null,
          stripe_checkout_session_id: session.id,
          paid_until: paidUntil,
        })
        .eq('slug', blocoSlug)

      if (error) console.error('Falha ao ativar bloco', blocoSlug, error)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    await admin
      .from('blocos')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', subscription.id)
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = invoice.subscription
    if (typeof subscriptionId === 'string') {
      await admin.from('blocos').update({ status: 'past_due' }).eq('stripe_subscription_id', subscriptionId)
    }
  }

  res.status(200).json({ received: true })
}
