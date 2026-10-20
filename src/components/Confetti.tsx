import { useState, type CSSProperties } from 'react'
import { prefersReducedMotion } from '../lib/motion'

// Confete só com CSS: cada pedaço estoura do centro pra cima/pros lados
// e depois cai (animação confetti-fall em index.css, com --bx/--by,
// --dx/--dy e --rot por pedaço). Usa as cores do bloco, então combina
// com qualquer tema.
const COLORS = [
  'var(--bloco-primary)',
  'var(--bloco-accent)',
  '#06a77d',
  '#e63946',
  '#118ab2',
  '#161616',
]

export function Confetti({ pieces = 34 }: { pieces?: number }) {
  // gerado uma vez por montagem (initializer do useState, não a cada render)
  const [items] = useState(
    () =>
      Array.from({ length: pieces }, (_, i) => {
        // estouro: leque pra cima, de -165° a -15° (0° = direita)
        const angle = ((-165 + Math.random() * 150) * Math.PI) / 180
        const burst = 70 + Math.random() * 110
        const bx = Math.cos(angle) * burst
        const by = Math.sin(angle) * burst
        return {
          id: i,
          color: COLORS[i % COLORS.length],
          bx: `${bx}px`,
          by: `${by}px`,
          // queda: continua abrindo um pouco pro lado e despenca
          dx: `${bx * 1.5}px`,
          dy: `${by + 220 + Math.random() * 160}px`,
          rot: `${(Math.random() - 0.5) * 720}deg`,
          delay: `${Math.random() * 90}ms`,
          duration: `${1100 + Math.random() * 500}ms`,
          w: 6 + Math.round(Math.random() * 5),
          h: 9 + Math.round(Math.random() * 7),
          round: Math.random() < 0.3,
        }
      }),
  )

  if (prefersReducedMotion()) return null

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-visible z-20">
      <div className="absolute left-1/2 top-1/2">
        {items.map((p) => (
          <span
            key={p.id}
            className={`absolute border border-bloco-ink/40 ${p.round ? 'rounded-full' : 'rounded-[2px]'}`}
            style={
              {
                width: p.w,
                height: p.round ? p.w : p.h,
                marginLeft: -p.w / 2,
                background: p.color,
                '--bx': p.bx,
                '--by': p.by,
                '--dx': p.dx,
                '--dy': p.dy,
                '--rot': p.rot,
                animation: `confetti-fall ${p.duration} linear ${p.delay} both`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  )
}
