import { Link } from 'react-router-dom'
import { Button, Footer } from '../components/ui'

export default function Cancelado() {
  return (
    <div className="min-h-full bg-tl-paper flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-sm w-full bg-white border-2 border-tl-ink rounded-[10px] p-7 text-center">
        <p className="font-display text-sm text-tl-ink">PAGAMENTO NÃO CONCLUÍDO</p>
        <p className="text-sm text-tl-muted mt-2">
          Nenhuma cobrança foi feita. Se foi sem querer, pode tentar de novo quando quiser.
        </p>
        <Link to="/cadastrar" className="inline-block mt-6">
          <Button>TENTAR DE NOVO</Button>
        </Link>
      </div>
      <Footer />
    </div>
  )
}
