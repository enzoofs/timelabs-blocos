import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | null = null

/** Cliente com a service role key — ignora RLS. Só usar no servidor. */
export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached
  const url = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Faltam VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente do servidor.',
    )
  }
  cached = createClient(url, serviceKey, { auth: { persistSession: false } })
  return cached
}
