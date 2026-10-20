import { useEffect, useRef, useState } from 'react'

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

// Vibração curta de feedback. Só Android implementa navigator.vibrate —
// no iPhone a chamada simplesmente não existe e nada acontece.
export function haptic(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // alguns navegadores lançam se a página não teve interação ainda
  }
}

/** Anima um número de onde estava até `value` (ease-out). */
export function useCountUp(value: number, ms = 600): number {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    if (from === value || prefersReducedMotion()) {
      fromRef.current = value
      setDisplay(value)
      return
    }
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      fromRef.current = value
    }
  }, [value, ms])

  return display
}

/** Reinicia uma animação CSS de "uma vez" (ex: shake) a cada chamada. */
export function useRetrigger(): [number, () => void] {
  const [key, setKey] = useState(0)
  return [key, () => setKey((k) => k + 1)]
}
