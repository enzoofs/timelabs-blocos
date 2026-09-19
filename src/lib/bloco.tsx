import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'

export type BlocoTheme = {
  primary?: string
  accent?: string
}

export type Bloco = {
  id: string
  slug: string
  name: string
  city: string | null
  theme: BlocoTheme
  instruments: string[]
}

type BlocoState =
  | { status: 'loading' }
  | { status: 'not_found' }
  | { status: 'ready'; bloco: Bloco }

type BlocoContextValue = BlocoState & { refreshBloco: () => Promise<void> }

const BlocoContext = createContext<BlocoContextValue>({
  status: 'loading',
  refreshBloco: async () => {},
})

const DEFAULT_PRIMARY = '#ff5a3c'
const DEFAULT_ACCENT = '#ffb703'

export function BlocoProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [state, setState] = useState<BlocoState>({ status: 'loading' })

  async function load(): Promise<boolean> {
    const { data, error } = await supabase
      .from('blocos_public')
      .select('id, slug, name, city, theme, instruments')
      .eq('slug', slug)
      .maybeSingle()
    if (error || !data) {
      if (error) console.error('Falha ao carregar bloco', slug, error)
      setState({ status: 'not_found' })
      return false
    }
    setState({ status: 'ready', bloco: data as Bloco })
    return true
  }

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    load().catch(() => {
      if (!cancelled) setState({ status: 'not_found' })
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    const root = document.documentElement
    if (state.status === 'ready') {
      const accent = state.bloco.theme.accent || DEFAULT_ACCENT
      root.style.setProperty('--bloco-primary', state.bloco.theme.primary || DEFAULT_PRIMARY)
      root.style.setProperty('--bloco-accent', accent)
      // o accent é escolhido livremente pelo diretor — pode ser um
      // amarelo/verde claro que fica ilegível como texto direto no
      // papel. Escurece pra usar como cor de texto (--bloco-accent
      // continua puro pra fundos/badges em cima do ink escuro).
      root.style.setProperty('--bloco-accent-text', `color-mix(in srgb, ${accent} 50%, black)`)
    }
    return () => {
      root.style.removeProperty('--bloco-primary')
      root.style.removeProperty('--bloco-accent')
      root.style.removeProperty('--bloco-accent-text')
    }
  }, [state])

  async function refreshBloco() {
    await load()
  }

  return <BlocoContext.Provider value={{ ...state, refreshBloco }}>{children}</BlocoContext.Provider>
}

export function useBlocoState() {
  return useContext(BlocoContext)
}

export function useBloco(): Bloco {
  const state = useContext(BlocoContext)
  if (state.status !== 'ready') {
    throw new Error('useBloco só pode ser usado dentro de um bloco carregado')
  }
  return state.bloco
}

export function useRefreshBloco() {
  return useContext(BlocoContext).refreshBloco
}

// Todo link/navegação dentro do app de um bloco precisa ficar sob
// /:blocoSlug/... — esse helper monta o path certo a partir de um
// sufixo relativo tipo '/member' ou '/checkin/abc'.
export function useBlocoPath() {
  const bloco = useBloco()
  return (suffix: string) => `/${bloco.slug}${suffix}`
}
