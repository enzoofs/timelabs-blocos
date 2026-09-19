import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-tl-violet text-white border-tl-ink shadow-hard-sm',
  secondary: 'bg-white text-tl-ink border-tl-ink',
  ghost: 'bg-transparent text-tl-ink border-transparent',
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...rest}
      className={`px-4 py-2.5 rounded-md border-2 font-display text-xs tracking-wide disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props
  return (
    <input
      {...rest}
      className={`w-full px-3 py-2.5 rounded-md border-2 border-tl-ink bg-white text-sm focus:outline-none focus:ring-2 focus:ring-tl-violet ${className}`}
    />
  )
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="block font-display text-[11px] tracking-wide text-tl-ink mb-1.5">
      {children}
    </label>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border-2 border-tl-ink rounded-[10px] ${className}`}>{children}</div>
  )
}

export function Footer({ className = '' }: { className?: string }) {
  return (
    <footer className={`text-center py-8 ${className}`}>
      <a
        href="https://timelabs.com.br"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-bold text-tl-muted hover:text-tl-ink"
      >
        UMA INICIATIVA DA TIMELABS
      </a>
    </footer>
  )
}
