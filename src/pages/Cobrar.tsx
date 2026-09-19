import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { createCheckoutSession, type CheckoutPlan } from '../lib/stripe'
import { MONTHLY_PRICE, formatBRL, formatDatePtBR, lumpSumPrice, monthsUntil, nextCarnaval } from '../lib/pricing'
import { Button, Footer, Input, Label } from '../components/ui'

type BlocoPublic = { id: string; name: string; slug: string }

// Página só existe pra migrar a cobrança dos dois blocos que já
// estavam ativos antes de existir checkout (Abalô-Caxi e Lavô Tá
// Novo) — não é uma forma geral de "recobrar" qualquer bloco.
const ALLOWED_SLUGS = ['abalo-caxi', 'lavo-ta-novo']

export default function Cobrar() {
  const { blocoSlug } = useParams<{ blocoSlug: string }>()
  const [bloco, setBloco] = useState<BlocoPublic | 'loading' | 'not_found'>('loading')
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState<CheckoutPlan>('monthly')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const carnaval = useMemo(() => nextCarnaval(), [])
  const months = useMemo(() => monthsUntil(carnaval), [carnaval])
  const lumpSum = useMemo(() => lumpSumPrice(months), [months])

  useEffect(() => {
    if (!blocoSlug || !ALLOWED_SLUGS.includes(blocoSlug)) {
      setBloco('not_found')
      return
    }
    supabase
      .from('blocos_public')
      .select('id, name, slug')
      .eq('slug', blocoSlug)
      .maybeSingle()
      .then(({ data }) => setBloco(data ?? 'not_found'))
  }, [blocoSlug])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (bloco === 'loading' || bloco === 'not_found') return
    setError(null)
    if (!email.trim()) {
      setError('Preenche o e-mail de quem vai pagar.')
      return
    }
    setBusy(true)
    try {
      const { url } = await createCheckoutSession({
        blocoId: bloco.id,
        blocoSlug: bloco.slug,
        blocoName: bloco.name,
        email: email.trim().toLowerCase(),
        plan,
        months,
      })
      window.location.href = url
    } catch (err) {
      setBusy(false)
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar o pagamento.')
    }
  }

  if (bloco === 'loading') {
    return <div className="min-h-full grid place-items-center text-tl-muted">Carregando…</div>
  }

  if (bloco === 'not_found') {
    return (
      <div className="min-h-full flex items-center justify-center px-6 bg-tl-paper text-center">
        <p className="text-tl-muted">Bloco não encontrado.</p>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-tl-paper">
      <div className="max-w-md mx-auto px-6 py-10">
        <h1 className="font-display text-2xl text-tl-ink mt-3">Pagamento — {bloco.name}</h1>
        <p className="text-sm text-tl-muted mt-2 leading-relaxed">
          Escolhe o plano e o e-mail de quem está pagando — no fim você é levado pro pagamento
          seguro do Stripe.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <Label>E-MAIL DE QUEM VAI PAGAR</Label>
            <Input
              type="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>PLANO</Label>
            <div className="space-y-2">
              <PlanOption
                selected={plan === 'monthly'}
                onSelect={() => setPlan('monthly')}
                title="Mensal"
                price={`${formatBRL(MONTHLY_PRICE)}/mês`}
                detail="Cobrado todo mês, cancela quando quiser."
              />
              <PlanOption
                selected={plan === 'lump_sum'}
                onSelect={() => setPlan('lump_sum')}
                title={`Até o Carnaval (${months} ${months === 1 ? 'mês' : 'meses'})`}
                price={formatBRL(lumpSum)}
                detail={`Pagamento único, cobre até ${formatDatePtBR(carnaval)}. Economiza em relação ao mensal.`}
              />
            </div>
          </div>

          {error && <p className="text-sm font-semibold text-tl-red">{error}</p>}

          <Button type="submit" disabled={busy} className="w-full py-3.5">
            {busy ? 'PREPARANDO PAGAMENTO…' : 'IR PRO PAGAMENTO'}
          </Button>
          <p className="text-[11px] text-tl-muted text-center leading-relaxed">
            Pagamento processado pelo Stripe. Nenhum dado de cartão passa pelo nosso servidor.
          </p>
        </form>

        <Footer />
      </div>
    </div>
  )
}

function PlanOption({
  selected,
  onSelect,
  title,
  price,
  detail,
}: {
  selected: boolean
  onSelect: () => void
  title: string
  price: string
  detail: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-md border-2 p-3 transition-colors ${
        selected ? 'border-tl-violet bg-tl-violet/5' : 'border-tl-ink bg-white'
      }`}
    >
      <div className="flex justify-between items-baseline">
        <span className="font-bold text-sm text-tl-ink">{title}</span>
        <span className="font-display text-sm text-tl-violet">{price}</span>
      </div>
      <p className="text-xs text-tl-muted mt-1">{detail}</p>
    </button>
  )
}
