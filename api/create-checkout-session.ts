import type { VercelRequest, VercelResponse } from '@vercel/node'
import { stripeAdmin } from '../server/stripeAdmin'
import { MONTHLY_PRICE, lumpSumPrice, monthsUntil, nextCarnaval } from '../src/lib/pricing'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { blocoSlug, blocoName, email, plan } = (req.body ?? {}) as Record<string, unknown>

  if (
    typeof blocoSlug !== 'string' ||
    typeof blocoName !== 'string' ||
    typeof email !== 'string' ||
    (plan !== 'monthly' && plan !== 'lump_sum')
  ) {
    res.status(400).json({ error: 'Dados incompletos.' })
    return
  }

  // Recalcula os meses no servidor — nunca confia no que o cliente mandou.
  const months = monthsUntil(nextCarnaval())
  const origin = (req.headers.origin as string) || `https://${req.headers.host}`

  try {
    const stripe = stripeAdmin()

    const session = await stripe.checkout.sessions.create({
      mode: plan === 'monthly' ? 'subscription' : 'payment',
      customer_email: email,
      metadata: { blocoSlug, plan, months: String(months) },
      line_items: [
        plan === 'monthly'
          ? {
              price_data: {
                currency: 'brl',
                unit_amount: MONTHLY_PRICE * 100,
                recurring: { interval: 'month' },
                product_data: { name: `TimeLabs — ${blocoName} (mensal)` },
              },
              quantity: 1,
            }
          : {
              price_data: {
                currency: 'brl',
                unit_amount: lumpSumPrice(months) * 100,
                product_data: {
                  name: `TimeLabs — ${blocoName} (até o Carnaval, ${months} ${months === 1 ? 'mês' : 'meses'})`,
                },
              },
              quantity: 1,
            },
      ],
      success_url: `${origin}/inscricao/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/inscricao/cancelado`,
    })

    if (!session.url) throw new Error('Stripe não retornou URL de checkout.')
    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('create-checkout-session error', err)
    res.status(500).json({ error: 'Não foi possível iniciar o pagamento. Tenta de novo em instantes.' })
  }
}
