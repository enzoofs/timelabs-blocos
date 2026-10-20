import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCurrentPosition, type GeoError } from '../lib/geo'
import { Button, LinkButton } from '../components/product/ui'
import { useBlocoPath } from '../lib/bloco'
import { Confetti } from '../components/Confetti'
import { haptic } from '../lib/motion'
import { playCheckinSound, unlockAudio } from '../lib/sound'

type CheckinResponse = {
  ok: boolean
  error?: string
  attendance_id?: string
  event_name?: string
  distance_meters?: number
}

type Status =
  | { kind: 'locating' }
  | { kind: 'submitting' }
  | { kind: 'success'; result: CheckinResponse }
  | { kind: 'error'; message: string; subline?: string }

const ERROR_LABELS: Record<string, { title: string; sub?: string }> = {
  not_whitelisted: {
    title: 'Conta não cadastrada',
    sub: 'Seu e-mail não está vinculado a um membro.',
  },
  invalid_qr: {
    title: 'QR inválido',
    sub: 'Esse QR não corresponde a nenhum ensaio.',
  },
  too_early: {
    title: 'Ainda é cedo',
    sub: 'Esse ensaio ainda não começou.',
  },
  too_late: {
    title: 'Ensaio encerrado',
    sub: 'A janela de check-in já fechou.',
  },
  too_far: {
    title: 'Fora do local',
    sub: 'Aproxime-se do ponto de encontro do ensaio.',
  },
  already_checked_in: {
    title: 'Você já marcou presença',
    sub: 'Nesse ensaio sua presença já está registrada.',
  },
}

function PinIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#161616" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#161616" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      {/* traço "desenhado" depois que o carimbo assenta */}
      <path d="M8 12.5l2.5 2.5L16 9" strokeDasharray="24" className="animate-draw" />
    </svg>
  )
}

function WarnIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#161616" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l10 18H2L12 2z" />
      <line x1="12" y1="9" x2="12" y2="14" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export default function Checkin() {
  const { token } = useParams<{ token: string }>()
  const blocoPath = useBlocoPath()
  const [status, setStatus] = useState<Status>({ kind: 'locating' })
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true
    if (!token) {
      setStatus({ kind: 'error', message: 'QR inválido' })
      return
    }
    runCheckin(token)
  }, [token])

  async function runCheckin(qrToken: string) {
    setStatus({ kind: 'locating' })
    let coords
    try {
      coords = await getCurrentPosition()
    } catch (err) {
      const geo = err as GeoError
      setStatus({ kind: 'error', message: geo.message })
      haptic(80)
      return
    }

    setStatus({ kind: 'submitting' })

    const { data, error } = await supabase.rpc('check_in', {
      p_qr_token: qrToken,
      p_latitude: coords.latitude,
      p_longitude: coords.longitude,
    })

    if (error) {
      setStatus({ kind: 'error', message: error.message })
      haptic(80)
      return
    }

    const res = data as CheckinResponse
    if (res.ok) {
      setStatus({ kind: 'success', result: res })
      haptic([30, 40, 60])
      playCheckinSound()
    } else {
      haptic(80)
      const label = ERROR_LABELS[res.error ?? ''] ?? { title: 'Não foi possível marcar presença' }
      const sub =
        res.error === 'too_far' && res.distance_meters
          ? `Você está a ${res.distance_meters}m do local.`
          : label.sub
      setStatus({ kind: 'error', message: label.title, subline: sub })
    }
  }

  function retry() {
    unlockAudio()
    ranRef.current = false
    if (token) runCheckin(token)
  }

  return (
    <div className="min-h-full p-6 flex flex-col justify-center max-w-md mx-auto bg-bloco-paper overflow-hidden">
      {status.kind === 'locating' && (
        <div className="text-center animate-rise">
          {/* pin quicando em cima de um "radar" */}
          <div className="relative mx-auto mb-5 w-24 h-24 flex items-center justify-center">
            <span className="absolute bottom-3 w-10 h-10 rounded-full border-2 border-bloco-primary animate-pulse-ring" />
            <span className="absolute bottom-3 w-10 h-10 rounded-full border-2 border-bloco-primary animate-pulse-ring [animation-delay:.8s]" />
            <span className="absolute bottom-[18px] w-6 h-1.5 rounded-full bg-bloco-ink/15" />
            <div className="relative animate-bob">
              <PinIcon />
            </div>
          </div>
          <p className="font-bold">Obtendo sua localização…</p>
          <p className="text-sm text-bloco-muted mt-1">Aguarde uns segundos.</p>
        </div>
      )}

      {status.kind === 'submitting' && (
        <div className="text-center animate-rise">
          <div className="mb-4 flex justify-center">
            <div className="w-10 h-10 rounded-full border-4 border-bloco-ink border-t-transparent animate-spin" />
          </div>
          <p className="font-bold">Registrando presença…</p>
        </div>
      )}

      {status.kind === 'success' && (
        <div className="text-center">
          <div className="relative flex justify-center mb-5">
            <Confetti />
            <div className="relative w-24 h-24 rounded-full bg-bloco-green border-[2.5px] border-bloco-ink flex items-center justify-center shadow-hard animate-stamp">
              <CheckIcon />
            </div>
          </div>
          <div className="stagger">
            <h1 className="text-2xl font-extrabold mb-2" style={{ '--i': 4 } as CSSProperties}>
              Presença registrada!
            </h1>
            {status.result.event_name && (
              <p className="text-bloco-ink font-bold" style={{ '--i': 5 } as CSSProperties}>
                {status.result.event_name}
              </p>
            )}
            {status.result.distance_meters !== undefined && (
              <p className="text-xs text-bloco-muted mt-1" style={{ '--i': 6 } as CSSProperties}>
                {status.result.distance_meters}m do local
              </p>
            )}
            <div style={{ '--i': 8 } as CSSProperties}>
              <LinkButton to={blocoPath('/')} className="w-full mt-8 py-3">
                VOLTAR
              </LinkButton>
            </div>
          </div>
        </div>
      )}

      {status.kind === 'error' && (
        <div className="text-center">
          <div className="flex justify-center mb-5">
            <div className="animate-pop-in">
              <div className="w-20 h-20 rounded-full bg-bloco-accent border-2 border-bloco-ink flex items-center justify-center shadow-hard-sm animate-shake [animation-delay:.3s]">
                <WarnIcon />
              </div>
            </div>
          </div>
          <div className="stagger">
            <h1 className="text-2xl font-extrabold mb-2" style={{ '--i': 2 } as CSSProperties}>
              {status.message}
            </h1>
            {status.subline && (
              <p className="text-bloco-ink" style={{ '--i': 3 } as CSSProperties}>
                {status.subline}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2 mt-8" style={{ '--i': 5 } as CSSProperties}>
              <LinkButton to={blocoPath('/')} variant="secondary" className="py-3">
                VOLTAR
              </LinkButton>
              <Button onClick={retry} className="py-3">
                TENTAR DE NOVO
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
