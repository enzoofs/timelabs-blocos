// Bloco cinza com brilho passando — ocupa o lugar do conteúdo enquanto
// carrega, em vez do texto "Carregando…".
export function Skeleton({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div
      aria-hidden
      className={`relative overflow-hidden rounded-md ${dark ? 'bg-white/15' : 'bg-stone-200'} ${className}`}
    >
      <div
        className={`absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent to-transparent ${dark ? 'via-white/20' : 'via-white/60'}`}
      />
    </div>
  )
}
