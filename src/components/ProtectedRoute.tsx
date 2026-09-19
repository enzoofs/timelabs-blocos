import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../lib/auth'
import { useBlocoPath } from '../lib/bloco'

type Props = {
  children: ReactNode
  requireDirector?: boolean
}

export function ProtectedRoute({ children, requireDirector = false }: Props) {
  const { session, member, loading, whitelistError } = useAuth()
  const location = useLocation()
  const blocoPath = useBlocoPath()

  if (loading) {
    return <div className="min-h-full grid place-items-center text-stone-500">Carregando…</div>
  }
  if (!session) {
    const next = location.pathname + location.search
    const loginUrl = blocoPath('/login')
    const url = next === blocoPath('/') ? loginUrl : `${loginUrl}?next=${encodeURIComponent(next)}`
    return <Navigate to={url} replace />
  }
  if (whitelistError) return <Navigate to={blocoPath('/nao-cadastrado')} replace />
  if (!member) {
    return <div className="min-h-full grid place-items-center text-stone-500">Carregando perfil…</div>
  }
  if (requireDirector && member.role !== 'director') return <Navigate to={blocoPath('/')} replace />

  return <>{children}</>
}
