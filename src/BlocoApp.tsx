import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { BlocoProvider, useBlocoState } from './lib/bloco'
import { AuthProvider, useAuth } from './lib/auth'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import NotWhitelisted from './pages/NotWhitelisted'
import TrocarSenha from './pages/TrocarSenha'
import Checkin from './pages/Checkin'
import MemberHome from './pages/member/Home'
import MemberScanner from './pages/member/Scanner'
import MemberHistorico from './pages/member/Historico'
import DirectorEventos from './pages/director/Eventos'
import NovoEvento from './pages/director/NovoEvento'
import EventoDetalhe from './pages/director/EventoDetalhe'
import Membros from './pages/director/Membros'
import Relatorio from './pages/director/Relatorio'

function RoleRedirect() {
  const { member } = useAuth()
  if (!member) return null
  return <Navigate to={member.role === 'director' ? 'director' : 'member'} replace />
}

function BlocoRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="nao-cadastrado" element={<NotWhitelisted />} />

        <Route
          index
          element={
            <ProtectedRoute>
              <RoleRedirect />
            </ProtectedRoute>
          }
        />

        <Route
          path="trocar-senha"
          element={
            <ProtectedRoute>
              <TrocarSenha />
            </ProtectedRoute>
          }
        />

        <Route
          path="checkin/:token"
          element={
            <ProtectedRoute>
              <Checkin />
            </ProtectedRoute>
          }
        />

        <Route
          path="member"
          element={
            <ProtectedRoute>
              <MemberHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="member/scanner"
          element={
            <ProtectedRoute>
              <MemberScanner />
            </ProtectedRoute>
          }
        />
        <Route
          path="member/historico"
          element={
            <ProtectedRoute>
              <MemberHistorico />
            </ProtectedRoute>
          }
        />

        <Route
          path="director"
          element={
            <ProtectedRoute requireDirector>
              <DirectorEventos />
            </ProtectedRoute>
          }
        />
        <Route
          path="director/novo"
          element={
            <ProtectedRoute requireDirector>
              <NovoEvento />
            </ProtectedRoute>
          }
        />
        <Route
          path="director/eventos/:id"
          element={
            <ProtectedRoute requireDirector>
              <EventoDetalhe />
            </ProtectedRoute>
          }
        />
        <Route
          path="director/eventos/:id/editar"
          element={
            <ProtectedRoute requireDirector>
              <NovoEvento />
            </ProtectedRoute>
          }
        />
        <Route
          path="director/membros"
          element={
            <ProtectedRoute requireDirector>
              <Membros />
            </ProtectedRoute>
          }
        />
        <Route
          path="director/relatorio"
          element={
            <ProtectedRoute requireDirector>
              <Relatorio />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </AuthProvider>
  )
}

function BlocoGate() {
  const state = useBlocoState()

  if (state.status === 'loading') {
    return <div className="min-h-full grid place-items-center text-stone-500">Carregando…</div>
  }

  if (state.status === 'not_found') {
    return (
      <div className="min-h-full grid place-items-center px-6 text-center">
        <div>
          <p className="font-display text-lg text-tl-ink">Bloco não encontrado</p>
          <p className="text-sm text-tl-muted mt-2">
            Confira o endereço ou fale com a diretoria do seu bloco pra conseguir o link certo.
          </p>
        </div>
      </div>
    )
  }

  return <BlocoRoutes />
}

export default function BlocoApp() {
  const { blocoSlug } = useParams<{ blocoSlug: string }>()
  if (!blocoSlug) return <Navigate to="/" replace />

  return (
    <BlocoProvider slug={blocoSlug}>
      <BlocoGate />
    </BlocoProvider>
  )
}
