import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

// Aviso curto que sobe do rodapé e some sozinho — pra confirmar ações
// (copiado, salvo, preferência trocada) sem ocupar espaço na tela.

type Tone = 'ok' | 'error' | 'info'
type ToastItem = { id: number; message: string; tone: Tone }

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {})

const TONE_CLASSES: Record<Tone, string> = {
  ok: 'bg-bloco-green text-bloco-ink',
  error: 'bg-bloco-red text-white',
  info: 'bg-bloco-ink text-bloco-paper',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const show = useCallback((message: string, tone: Tone = 'info') => {
    const id = nextId.current++
    setItems((prev) => [...prev.slice(-2), { id, message, tone }])
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2500)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={`animate-rise max-w-sm w-full px-4 py-3 rounded-md border-2 border-bloco-ink shadow-hard-sm text-sm font-bold text-center ${TONE_CLASSES[t.tone]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
