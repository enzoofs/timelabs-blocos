import { loadStripe, type Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null

export function getStripe() {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  if (!key) {
    throw new Error('Falta VITE_STRIPE_PUBLISHABLE_KEY no .env.')
  }
  if (!stripePromise) stripePromise = loadStripe(key)
  return stripePromise
}

export type CheckoutPlan = 'monthly' | 'lump_sum'

export type CreateCheckoutInput = {
  blocoId: string // id do registro pendente em public.blocos — usado como chave de idempotência
  blocoSlug: string
  blocoName: string
  email: string
  plan: CheckoutPlan
  months: number // relevante só pro plano lump_sum
}

/** Chama a função serverless que cria a sessão de Checkout do Stripe. */
export async function createCheckoutSession(input: CreateCheckoutInput): Promise<{ url: string }> {
  const res = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Não foi possível iniciar o pagamento. Tenta de novo.')
  }
  return res.json()
}
