import type { VercelRequest, VercelResponse } from '@vercel/node'
import { stripeAdmin } from '../server/stripeAdmin.js'
import { supabaseAdmin } from '../server/supabaseAdmin.js'
import { MONTHLY_PRICE, lumpSumPrice, monthsUntil, nextCarnaval } from '../src/lib/pricing.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { blocoId, blocoSlug, blocoName, email, plan } = (req.body ?? {}) as Record<string, unknown>

  if (
    typeof blocoId !== 'string' ||
    typeof blocoSlug !== 'string' ||
    typeof blocoName !== 'string' ||
    typeof email !== 'string' ||
    (plan !== 'monthly' && plan !== 'lump_sum')
  ) {
    res.status(400).json({ error: 'Dados incompletos.' })
    return
  }

  // Confere que existe mesmo um cadastro pendente com esse id/slug antes
  // de gerar sessão de pagamento — sem isso, dava pra chamar essa rota
  // direto com dados inventados e criar sessões do Stripe pra blocos
  // que não existem.
  const admin = supabaseAdmin()
  const { data: bloco, error: blocoError } = await admin
    .from('blocos')
    .select('id')
    .eq('id', blocoId)
    .eq('slug', blocoSlug)
    .eq('status', 'pending')
    .maybeSingle()

  if (blocoError || !bloco) {
    res.status(404).json({ error: 'Cadastro do bloco não encontrado. Preenche o formulário de novo.' })
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
    }, {
      // Clique duplo ou retry de rede pro mesmo bloco + plano reaproveita a
      // mesma sessão em vez de criar uma cobrança nova. Se a pessoa mudar
      // de plano, a chave muda e uma sessão nova é criada normalmente.
      idempotencyKey: `checkout:${blocoId}:${plan}`,
    })

    if (!session.url) throw new Error('Stripe não retornou URL de checkout.')
    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('create-checkout-session error', err)
    res.status(500).json({ error: 'Não foi possível iniciar o pagamento. Tenta de novo em instantes.' })
  }
}
