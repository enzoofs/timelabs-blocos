import type { VercelRequest, VercelResponse } from '@vercel/node'
import { stripeAdmin } from '../server/stripeAdmin.js'
import { supabaseAdmin } from '../server/supabaseAdmin.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sessionId = req.query.session_id
  if (typeof sessionId !== 'string') {
    res.status(400).json({ error: 'session_id obrigatório' })
    return
  }

  try {
    const stripe = stripeAdmin()
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const blocoSlug = session.metadata?.blocoSlug
    if (!blocoSlug) {
      res.status(404).json({ error: 'Sessão não encontrada' })
      return
    }

    const admin = supabaseAdmin()
    const { data, error } = await admin
      .from('blocos')
      .select('name, slug, status')
      .eq('slug', blocoSlug)
      .maybeSingle()

    if (error || !data) {
      res.status(404).json({ error: 'Bloco não encontrado' })
      return
    }

    res.status(200).json({ name: data.name, slug: data.slug, status: data.status })
  } catch (err) {
    console.error('bloco-status error', err)
    res.status(500).json({ error: 'Erro ao consultar status.' })
  }
}
