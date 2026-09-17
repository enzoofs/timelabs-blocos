import Stripe from 'stripe'

let cached: Stripe | null = null

export function stripeAdmin(): Stripe {
  if (cached) return cached
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('Falta STRIPE_SECRET_KEY nas variáveis de ambiente do servidor.')
  }
  cached = new Stripe(key)
  return cached
}
