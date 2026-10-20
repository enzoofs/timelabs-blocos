import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { useBlocoPath } from '../../lib/bloco'
import { haptic, useRetrigger } from '../../lib/motion'
import { unlockAudio } from '../../lib/sound'

const READER_ID = 'qr-reader'

function extractToken(decoded: string): string | null {
  try {
    const url = new URL(decoded)
    const match = url.pathname.match(/\/checkin\/([a-f0-9-]+)/i)
    if (match) return match[1]
  } catch {
    // not a URL
  }
  if (/^[a-f0-9-]{36}$/i.test(decoded)) return decoded
  return null
}

type Phase = 'idle' | 'starting' | 'scanning' | 'found' | 'error'

const FLAG_COLORS = ['bg-bloco-red', 'bg-bloco-accent', 'bg-bloco-green', 'bg-bloco-accent', 'bg-bloco-accent']

export default function Scanner() {
  const navigate = useNavigate()
  const blocoPath = useBlocoPath()
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [badKey, triggerBad] = useRetrigger()
  const badTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const navigatedRef = useRef(false)

  useEffect(() => {
    return () => {
      const qr = scannerRef.current
      if (qr && qr.isScanning) {
        qr.stop()
          .catch(() => {})
          .finally(() => {
            try {
              qr.clear()
            } catch {
              // ignore
            }
          })
      }
    }
  }, [])

  async function startCamera() {
    unlockAudio()
    setError(null)
    setPhase('starting')
    try {
      const qr = new Html5Qrcode(READER_ID, { verbose: false })
      scannerRef.current = qr
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10 },
        (decoded) => {
          if (navigatedRef.current) return
          const token = extractToken(decoded)
          if (!token) {
            // o callback dispara ~10x por segundo com o QR errado na frente:
            // treme/vibra só na primeira leitura e vai adiando o "voltar ao
            // normal" enquanto o QR errado continuar na mira
            if (badTimerRef.current === undefined) {
              setError('QR não reconhecido. Use o QR do ensaio.')
              triggerBad()
              haptic(80)
            }
            clearTimeout(badTimerRef.current)
            badTimerRef.current = setTimeout(() => {
              badTimerRef.current = undefined
              setError(null)
            }, 2000)
            return
          }
          navigatedRef.current = true
          // mira fecha + flash antes de sair da tela: dá a sensação de "pegou"
          setPhase('found')
          haptic(30)
          qr.stop()
            .catch(() => {})
            .finally(() => {
              setTimeout(() => navigate(blocoPath(`/checkin/${token}`)), 260)
            })
        },
        () => {
          // scan errors fire continuously while no QR is in frame; ignore
        },
      )
      setPhase('scanning')
    } catch (err) {
      console.error('Scanner error', err)
      setPhase('error')
      setError(
        err instanceof Error
          ? `Não consegui abrir a câmera: ${err.message}`
          : 'Não consegui abrir a câmera.',
      )
      scannerRef.current = null
    }
  }

  return (
    <div className="min-h-full bg-[#2b2b2b] text-bloco-paper flex flex-col">
      <div className="flex items-center justify-between px-5 pt-6">
        <button
          onClick={() => navigate(blocoPath('/'))}
          className="w-[38px] h-[38px] rounded-lg bg-bloco-paper border-[2.5px] border-bloco-ink flex items-center justify-center"
          aria-label="Voltar"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#161616" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div className="-rotate-2 bg-bloco-ink px-4 py-1.5">
          <span className="font-display text-xs tracking-wider text-bloco-accent">ESCANEAR QR</span>
        </div>
        <div className="w-[38px]" />
      </div>

      <div className="relative mx-6 mt-8 aspect-square rounded-lg overflow-hidden bg-black">
        <div
          id={READER_ID}
          className="w-full h-full [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover [&_video]:!min-w-0"
        />

        {/* corner brackets, drawn with CSS so they scale with the frame.
            Fecham pro centro quando o QR é lido; ficam vermelhas e tremem
            com QR que não é de ensaio. */}
        <div
          key={badKey}
          className={`absolute inset-4 pointer-events-none z-10 transition-transform duration-200 ease-bounce ${
            phase === 'found' ? 'scale-[.82]' : ''
          } ${badKey > 0 ? 'animate-shake' : ''}`}
        >
          {[
            'top-0 left-0 border-t-[6px] border-l-[6px] rounded-tl-xl',
            'top-0 right-0 border-t-[6px] border-r-[6px] rounded-tr-xl',
            'bottom-0 left-0 border-b-[6px] border-l-[6px] rounded-bl-xl',
            'bottom-0 right-0 border-b-[6px] border-r-[6px] rounded-br-xl',
          ].map((pos) => (
            <span
              key={pos}
              className={`absolute w-9 h-9 transition-colors duration-200 ${pos} ${
                error && phase === 'scanning' ? 'border-bloco-red' : phase === 'found' ? 'border-bloco-green' : 'border-bloco-accent'
              }`}
            />
          ))}
        </div>

        {/* linha de varredura enquanto procura o QR */}
        {phase === 'scanning' && (
          <div className="absolute inset-x-6 top-6 bottom-6 pointer-events-none z-10 overflow-hidden [container-type:size]">
            <div
              className="h-0.5 w-full rounded-full bg-bloco-accent shadow-[0_0_12px_2px_var(--bloco-accent)] animate-scan"
              style={{ '--scan-distance': 'calc(100cqh - 2px)' } as CSSProperties}
            />
          </div>
        )}

        {phase === 'found' && <div className="absolute inset-0 bg-white z-30 pointer-events-none animate-flash" />}

        {(phase === 'idle' || phase === 'starting' || phase === 'error') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            {phase === 'starting' ? (
              <p className="text-sm font-semibold">Abrindo câmera…</p>
            ) : (
              <button
                onClick={startCamera}
                className="px-5 py-3 rounded-md border-[2.5px] border-bloco-ink bg-bloco-accent font-display text-xs tracking-wide text-bloco-ink shadow-hard-sm"
              >
                ABRIR CÂMERA
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mt-6 px-12 text-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9c0b3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p className="text-[13.5px] font-semibold text-stone-300">
          {phase === 'scanning'
            ? 'Aponte para o QR no ponto de encontro do ensaio'
            : 'Aponte a câmera pro QR Code disponibilizado pela direção.'}
        </p>
      </div>

      {error && (
        <p key={badKey} className="text-sm font-semibold text-bloco-primary text-center mt-4 px-8 animate-pop-in">
          {error}
        </p>
      )}

      <div className="mt-auto px-6 pb-9 pt-8 flex flex-col items-center gap-4 bg-gradient-to-t from-bloco-ink to-transparent">
        <div className="flex gap-1.5">
          {FLAG_COLORS.map((c) => (
            <span key={c} className={`w-[26px] h-[9px] rounded-sm ${c}`} />
          ))}
        </div>
        <button
          onClick={() => navigate(blocoPath('/'))}
          className="w-full max-w-sm py-3.5 rounded-md border-[2.5px] border-bloco-ink bg-bloco-paper text-bloco-ink font-display text-[13px] tracking-wide"
        >
          CANCELAR
        </button>
      </div>
    </div>
  )
}
