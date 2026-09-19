import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { useBloco } from './bloco'

export type Member = {
  id: string
  bloco_id: string
  auth_user_id: string | null
  email: string
  full_name: string
  whatsapp: string
  instrument: string | null
  role: 'member' | 'director'
}

type AuthState = {
  session: Session | null
  member: Member | null
  loading: boolean
  whitelistError: boolean
}

type AuthContextValue = AuthState & {
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshMember: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const bloco = useBloco()
  const [session, setSession] = useState<Session | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [whitelistError, setWhitelistError] = useState(false)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (!data.session) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session) {
      setMember(null)
      setWhitelistError(false)
      setLoading(false)
      return
    }
    void loadMember(session.user.id)
  }, [session?.user.id, bloco.id])

  async function loadMember(userId: string) {
    setLoading(true)
    setWhitelistError(false)
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('bloco_id', bloco.id)
      .eq('auth_user_id', userId)
      .maybeSingle()
    if (error) console.error('loadMember error', error)
    if (!data) {
      setWhitelistError(true)
      setMember(null)
    } else {
      setMember(data as Member)
    }
    setLoading(false)
  }

  async function refreshMember() {
    if (session) await loadMember(session.user.id)
  }

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ session, member, loading, whitelistError, signInWithEmail, signOut, refreshMember }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
