import React from 'react'
import { interpolate, useCurrentFrame } from 'remotion'
import { BRAND, display } from '../styles'

const sans: React.CSSProperties = { fontFamily: '"Manrope", sans-serif' }

export const ScreenLogin: React.FC = () => (
  <div style={{ width: '100%', height: '100%', background: BRAND.violet, position: 'relative' }}>
    <div style={{ position: 'absolute', top: 90, left: '50%', transform: 'translateX(-50%)' }}>
      <div
        style={{
          transform: 'rotate(-3deg)',
          background: BRAND.ink,
          color: BRAND.lime,
          padding: '8px 20px',
          borderRadius: 6,
          fontSize: 16,
          ...display,
        }}
      >
        BLOCO DE CARNAVAL
      </div>
    </div>
    <div
      style={{
        position: 'absolute',
        top: 220,
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#fff',
        fontSize: 44,
        textAlign: 'center',
        ...display,
      }}
    >
      SEU BLOCO
    </div>
    <div
      style={{
        position: 'absolute',
        bottom: 90,
        left: 28,
        right: 28,
        background: BRAND.paper,
        borderRadius: 18,
        border: `3px solid ${BRAND.ink}`,
        padding: 24,
      }}
    >
      <div style={{ ...sans, fontWeight: 700, fontSize: 15, marginBottom: 10 }}>E-MAIL</div>
      <div style={{ height: 44, borderRadius: 10, border: `2px solid ${BRAND.ink}`, background: '#fff', marginBottom: 16 }} />
      <div style={{ ...sans, fontWeight: 700, fontSize: 15, marginBottom: 10 }}>SENHA</div>
      <div style={{ height: 44, borderRadius: 10, border: `2px solid ${BRAND.ink}`, background: '#fff', marginBottom: 20 }} />
      <div
        style={{
          height: 54,
          borderRadius: 10,
          background: BRAND.violet,
          border: `2.5px solid ${BRAND.ink}`,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          ...display,
        }}
      >
        ENTRAR
      </div>
    </div>
  </div>
)

const EMAIL_TEXT = 'maria@gmail.com'
const PASSWORD_DIGITS = '885521'

export const ScreenLoginTyping: React.FC<{
  emailStart: number
  emailDur: number
  passwordStart: number
  passwordDur: number
  pressStart: number
}> = ({ emailStart, emailDur, passwordStart, passwordDur, pressStart }) => {
  const frame = useCurrentFrame()

  const emailChars = Math.round(
    interpolate(frame, [emailStart, emailStart + emailDur], [0, EMAIL_TEXT.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  )
  const passwordChars = Math.round(
    interpolate(frame, [passwordStart, passwordStart + passwordDur], [0, PASSWORD_DIGITS.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  )
  const emailDone = emailChars >= EMAIL_TEXT.length
  const passwordDone = passwordChars >= PASSWORD_DIGITS.length
  const emailFocused = frame >= emailStart && !emailDone
  const passwordFocused = frame >= passwordStart && !passwordDone
  const cursorOn = Math.floor(frame / 12) % 2 === 0

  const pressed = interpolate(frame, [pressStart, pressStart + 8, pressStart + 16], [1, 0.94, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div style={{ width: '100%', height: '100%', background: BRAND.violet, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 90, left: '50%', transform: 'translateX(-50%)' }}>
        <div
          style={{
            transform: 'rotate(-3deg)',
            background: BRAND.ink,
            color: BRAND.lime,
            padding: '8px 20px',
            borderRadius: 6,
            fontSize: 16,
            ...display,
          }}
        >
          BLOCO DE CARNAVAL
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 220,
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#fff',
          fontSize: 44,
          textAlign: 'center',
          ...display,
        }}
      >
        SEU BLOCO
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 90,
          left: 28,
          right: 28,
          background: BRAND.paper,
          borderRadius: 18,
          border: `3px solid ${BRAND.ink}`,
          padding: 24,
        }}
      >
        <div style={{ ...sans, fontWeight: 700, fontSize: 15, marginBottom: 10 }}>E-MAIL</div>
        <div
          style={{
            height: 44,
            borderRadius: 10,
            border: `2px solid ${BRAND.ink}`,
            boxShadow: emailFocused ? `0 0 0 3px ${BRAND.violet}55` : 'none',
            background: '#fff',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 14,
            ...sans,
            fontSize: 17,
            color: BRAND.ink,
          }}
        >
          {EMAIL_TEXT.slice(0, emailChars)}
          {emailFocused && cursorOn && <span style={{ marginLeft: 1 }}>|</span>}
        </div>
        <div style={{ ...sans, fontWeight: 700, fontSize: 15, marginBottom: 10 }}>SENHA</div>
        <div
          style={{
            height: 44,
            borderRadius: 10,
            border: `2px solid ${BRAND.ink}`,
            boxShadow: passwordFocused ? `0 0 0 3px ${BRAND.violet}55` : 'none',
            background: '#fff',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 14,
            gap: 6,
          }}
        >
          {Array.from({ length: passwordChars }).map((_, i) => (
            <span
              key={i}
              style={{ width: 10, height: 10, borderRadius: '50%', background: BRAND.ink, display: 'inline-block' }}
            />
          ))}
          {passwordFocused && cursorOn && <span style={{ ...sans, fontSize: 17 }}>|</span>}
        </div>
        <div
          style={{
            height: 54,
            borderRadius: 10,
            background: BRAND.violet,
            border: `2.5px solid ${BRAND.ink}`,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            transform: `scale(${pressed})`,
            ...display,
          }}
        >
          ENTRAR
        </div>
      </div>
    </div>
  )
}

export const ScreenHome: React.FC = () => {
  const frame = useCurrentFrame()
  const pulse = interpolate(frame % 40, [0, 20, 40], [1, 1.04, 1])
  return (
    <div style={{ width: '100%', height: '100%', background: BRAND.paper, position: 'relative', padding: '70px 26px 26px' }}>
      <div
        style={{
          display: 'inline-block',
          transform: 'rotate(-2deg)',
          background: BRAND.ink,
          color: BRAND.lime,
          padding: '6px 16px',
          borderRadius: 6,
          fontSize: 13,
          marginBottom: 16,
          ...display,
        }}
      >
        BLOCO DE CARNAVAL
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 24, ...sans }}>Oi, Maria!</div>
      <div style={{ background: BRAND.ink, borderRadius: 16, padding: 20 }}>
        <div style={{ color: BRAND.lime, fontSize: 13, ...display, marginBottom: 10 }}>ACONTECENDO AGORA</div>
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 20, ...sans }}>Ensaio — Praça da Liberdade</div>
        <div
          style={{
            background: BRAND.lime,
            borderRadius: 10,
            padding: '16px 0',
            textAlign: 'center',
            fontSize: 16,
            transform: `scale(${pulse})`,
            ...display,
            color: BRAND.ink,
          }}
        >
          MARCAR PRESENÇA
        </div>
      </div>
    </div>
  )
}

// Padrão de QR falso — só pra vender a ilusão de "apontando pro QR",
// não é um QR de verdade nem precisa ser (não é decodificado por nada).
const QR_PATTERN = (() => {
  let seed = 42
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  const size = 9
  const cells: boolean[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => rand() > 0.5))
  // marcadores de posição nos 3 cantos, como um QR real
  const finder = (arr: boolean[][], r0: number, c0: number) => {
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6
        const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4
        arr[r0 + r][c0 + c] = isBorder || isCore
      }
  }
  finder(cells, 0, 0)
  finder(cells, 0, size - 7)
  finder(cells, size - 7, 0)
  return cells
})()

const FakeQR: React.FC<{ size: number }> = ({ size }) => (
  <div
    style={{
      width: size,
      height: size,
      display: 'grid',
      gridTemplateColumns: `repeat(${QR_PATTERN.length}, 1fr)`,
      gridTemplateRows: `repeat(${QR_PATTERN.length}, 1fr)`,
      background: '#fff',
      padding: size * 0.06,
      borderRadius: 8,
    }}
  >
    {QR_PATTERN.flatMap((row, r) =>
      row.map((on, c) => <div key={`${r}-${c}`} style={{ background: on ? '#111' : '#fff' }} />),
    )}
  </div>
)

export const ScreenScanner: React.FC = () => {
  const frame = useCurrentFrame()
  const pulse = interpolate(frame % 40, [0, 20, 40], [0.3, 1, 0.3])
  return (
    <div style={{ width: '100%', height: '100%', background: '#2b2b2b', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: '50%',
          transform: 'translateX(-50%) rotate(-2deg)',
          background: BRAND.ink,
          color: BRAND.lime,
          padding: '8px 20px',
          borderRadius: 6,
          fontSize: 16,
          ...display,
        }}
      >
        ESCANEAR QR
      </div>
      <div
        style={{
          position: 'absolute',
          top: 160,
          left: 40,
          right: 40,
          bottom: 220,
          borderRadius: 20,
          background: '#111',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FakeQR size={180} />
        {[
          { top: 0, left: 0, borderRight: 0, borderBottom: 0 },
          { top: 0, right: 0, borderLeft: 0, borderBottom: 0 },
          { bottom: 0, left: 0, borderRight: 0, borderTop: 0 },
          { bottom: 0, right: 0, borderLeft: 0, borderTop: 0 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 60,
              height: 60,
              border: `7px solid ${BRAND.lime}`,
              opacity: pulse,
              borderRadius: 12,
              ...pos,
            }}
          />
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 100, left: 40, right: 40, textAlign: 'center', color: '#ccc', fontSize: 16, ...sans }}>
        Aponte pro QR do ensaio
      </div>
    </div>
  )
}

export const ScreenSuccess: React.FC = () => {
  const frame = useCurrentFrame()
  const s = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })
  return (
    <div style={{ width: '100%', height: '100%', background: BRAND.paper, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: BRAND.green,
            border: `4px solid ${BRAND.ink}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 30px',
            transform: `scale(${s})`,
          }}
        >
          <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke={BRAND.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 12.5l2.5 2.5L16 9" />
          </svg>
        </div>
        <div style={{ fontSize: 32, ...display, color: BRAND.ink }}>PRESENÇA</div>
        <div style={{ fontSize: 32, ...display, color: BRAND.ink }}>REGISTRADA</div>
      </div>
    </div>
  )
}

export const ScreenDirectorPanel: React.FC = () => {
  const frame = useCurrentFrame()
  const names = ['Maria Silva', 'João Santos', 'Ana Pereira', 'Carlos Souza']
  return (
    <div style={{ width: '100%', height: '100%', background: BRAND.paper, position: 'relative', padding: '70px 26px 26px' }}>
      <div
        style={{
          display: 'inline-block',
          transform: 'rotate(-2deg)',
          background: BRAND.ink,
          color: BRAND.lime,
          padding: '6px 16px',
          borderRadius: 6,
          fontSize: 13,
          marginBottom: 20,
          ...display,
        }}
      >
        PAINEL DA DIREÇÃO
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, ...sans }}>Ensaio de hoje</div>
      {names.map((name, i) => {
        const appear = interpolate(frame, [i * 8, i * 8 + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        return (
          <div
            key={name}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#fff',
              border: `2px solid ${BRAND.ink}`,
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 10,
              opacity: appear,
              transform: `translateX(${(1 - appear) * 30}px)`,
            }}
          >
            <span style={{ ...sans, fontWeight: 700, fontSize: 17 }}>{name}</span>
            {appear > 0.6 && (
              <span
                style={{
                  background: BRAND.green,
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${BRAND.ink}`,
                }}
              >
                ✓
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export const ScreenReport: React.FC = () => {
  const frame = useCurrentFrame()
  const rows = [
    { name: 'Maria Silva', pct: 96 },
    { name: 'João Santos', pct: 88 },
    { name: 'Ana Pereira', pct: 74 },
  ]
  return (
    <div style={{ width: '100%', height: '100%', background: BRAND.paper, position: 'relative', padding: '70px 26px 26px' }}>
      <div
        style={{
          display: 'inline-block',
          transform: 'rotate(-2deg)',
          background: BRAND.ink,
          color: BRAND.lime,
          padding: '6px 16px',
          borderRadius: 6,
          fontSize: 13,
          marginBottom: 20,
          ...display,
        }}
      >
        RELATÓRIO
      </div>
      {rows.map((r, i) => {
        const grow = interpolate(frame, [i * 10, i * 10 + 25], [0, r.pct], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
        return (
          <div key={r.name} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', ...sans, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
              <span>{r.name}</span>
              <span>{Math.round(grow)}%</span>
            </div>
            <div style={{ height: 14, borderRadius: 7, background: '#fff', border: `2px solid ${BRAND.ink}`, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${grow}%`, background: BRAND.violet }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
