import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, Footer } from '../components/ui'

type Status = 'checking' | 'active' | 'pending' | 'error'

export default function Sucesso() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<Status>(() => (sessionId ? 'checking' : 'error'))
  const [blocoName, setBlocoName] = useState<string | null>(null)
  const [blocoSlug, setBlocoSlug] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [videoDismissed, setVideoDismissed] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false

    async function check() {
      try {
        const res = await fetch(`/api/bloco-status?session_id=${encodeURIComponent(sessionId!)}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (cancelled) return
        setBlocoName(data.name ?? null)
        setBlocoSlug(data.slug ?? null)
        if (data.status === 'active') {
          setStatus('active')
        } else {
          setStatus('pending')
        }
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [sessionId, attempts])

  useEffect(() => {
    if (status !== 'pending') return
    const t = setTimeout(() => setAttempts((a) => a + 1), 2500)
    return () => clearTimeout(t)
  }, [status])

  if (status === 'active' && !videoDismissed) {
    return (
      <div className="min-h-full bg-tl-paper flex flex-col items-center justify-center px-6 py-10">
        <div className="max-w-xs w-full bg-white border-2 border-tl-ink rounded-[10px] p-5 text-center">
          <p className="font-display text-sm text-tl-ink mb-1">PAGAMENTO CONFIRMADO ✓</p>
          <p className="text-xs text-tl-muted mb-4">Um tour rápido por tudo que você pode fazer:</p>
          <video
            src="/videos/tutorial-diretoria.mp4"
            controls
            playsInline
            autoPlay
            onEnded={() => setVideoDismissed(true)}
            className="w-full rounded-lg border-2 border-tl-ink"
          />
          <Button onClick={() => setVideoDismissed(true)} variant="secondary" className="w-full mt-4">
            PULAR
          </Button>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-tl-paper flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-sm w-full bg-white border-2 border-tl-ink rounded-[10px] p-7 text-center">
        {status === 'checking' && <p className="text-sm text-tl-muted">Confirmando pagamento…</p>}

        {status === 'pending' && (
          <>
            <p className="font-display text-sm text-tl-violet">QUASE LÁ</p>
            <p className="text-sm text-tl-muted mt-2">
              Pagamento recebido, só estamos ativando o sistema do bloco. Isso leva alguns segundos.
            </p>
          </>
        )}

        {status === 'active' && (
          <>
            <p className="font-display text-lg text-tl-ink">PAGAMENTO CONFIRMADO ✓</p>
            <p className="text-sm text-tl-muted mt-2">
              {blocoName ? <>O sistema do <strong>{blocoName}</strong> está ativo.</> : 'O sistema do seu bloco está ativo.'}
            </p>
            <div className="mt-5 bg-tl-paper border-2 border-tl-ink rounded-md p-3.5 text-left">
              <p className="text-xs text-tl-ink leading-relaxed">
                Seu login de diretor já está pronto: entre com o <strong>e-mail</strong> que você
                cadastrou e os <strong>6 últimos dígitos do seu WhatsApp</strong> como senha. Dá pra
                trocar a senha depois de entrar.
              </p>
            </div>
            {blocoSlug ? (
              <Link to={`/${blocoSlug}/login`} className="inline-block mt-6">
                <Button>ENTRAR NO SISTEMA</Button>
              </Link>
            ) : (
              <Link to="/" className="inline-block mt-6">
                <Button>VOLTAR PRO INÍCIO</Button>
              </Link>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <p className="font-display text-sm text-tl-red">NÃO CONSEGUIMOS CONFIRMAR</p>
            <p className="text-sm text-tl-muted mt-2">
              Se o pagamento foi concluído no Stripe, está tudo certo — só não conseguimos confirmar
              aqui agora. Fale com a gente que resolvemos.
            </p>
          </>
        )}
      </div>
      <Footer />
    </div>
  )
}
