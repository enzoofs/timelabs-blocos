import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro não tratado na interface', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-full flex items-center justify-center px-6 py-12 bg-tl-paper">
          <div className="max-w-sm text-center bg-white border-2 border-tl-ink rounded-[10px] p-6">
            <p className="font-display text-sm text-tl-ink">ALGO DEU ERRADO</p>
            <p className="text-sm text-tl-muted mt-2">
              Essa tela travou. Recarrega a página — se continuar acontecendo, fala com a gente.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 px-4 py-2.5 rounded-md border-2 border-tl-ink bg-tl-violet text-white font-display text-xs tracking-wide"
            >
              RECARREGAR
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
