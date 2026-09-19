import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { slugify } from '../lib/slug'
import { createCheckoutSession, type CheckoutPlan } from '../lib/stripe'
import { MONTHLY_PRICE, formatBRL, formatDatePtBR, lumpSumPrice, monthsUntil, nextCarnaval } from '../lib/pricing'
import { Button, Footer, Input, Label } from '../components/ui'

const DEFAULT_PRIMARY = '#7c3aed'
const DEFAULT_ACCENT = '#c6f135'

export default function Cadastrar() {
  const [name, setName] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [slug, setSlug] = useState('')
  const [city, setCity] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [primary, setPrimary] = useState(DEFAULT_PRIMARY)
  const [accent, setAccent] = useState(DEFAULT_ACCENT)
  const [plan, setPlan] = useState<CheckoutPlan>('monthly')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const carnaval = useMemo(() => nextCarnaval(), [])
  const months = useMemo(() => monthsUntil(carnaval), [carnaval])
  const lumpSum = useMemo(() => lumpSumPrice(months), [months])

  function handleNameChange(v: string) {
    setName(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !slug.trim() || !email.trim() || !whatsapp.trim()) {
      setError('Preencha nome, identificador, e-mail e WhatsApp.')
      return
    }
    if (whatsapp.replace(/\D/g, '').length < 6) {
      setError('WhatsApp precisa ter pelo menos 6 dígitos.')
      return
    }
    setBusy(true)

    // Gera o id no navegador: a tabela não deixa ninguém ler de volta o que
    // acabou de cadastrar (só o webhook do Stripe, com a service role, lê
    // dados sensíveis), então não dá pra usar .select() depois do insert.
    const blocoId = crypto.randomUUID()
    const trimmedSlug = slug.trim()
    const trimmedName = name.trim()

    const { error: insertErr } = await supabase.from('blocos').insert({
      id: blocoId,
      name: trimmedName,
      slug: trimmedSlug,
      city: city.trim() || null,
      contact_name: contactName.trim() || null,
      contact_email: email.trim().toLowerCase(),
      contact_whatsapp: whatsapp.trim(),
      theme: { primary, accent },
    })

    if (insertErr) {
      setBusy(false)
      if (insertErr.message.includes('duplicate') || insertErr.message.includes('unique')) {
        setError('Já existe um bloco cadastrado com esse identificador. Mude o campo "endereço".')
      } else {
        setError('Não deu pra salvar o cadastro: ' + insertErr.message)
      }
      return
    }

    try {
      const { url } = await createCheckoutSession({
        blocoId,
        blocoSlug: trimmedSlug,
        blocoName: trimmedName,
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

  return (
    <div className="min-h-full bg-tl-paper">
      <div className="max-w-md mx-auto px-6 py-10">
        <Link to="/" className="text-xs font-bold text-tl-muted">
          ← VOLTAR
        </Link>
        <h1 className="font-display text-2xl text-tl-ink mt-3">Cadastre seu bloco</h1>
        <p className="text-sm text-tl-muted mt-2 leading-relaxed">
          Preencha os dados do bloco, escolha as cores e o plano — no fim você é levado pro
          pagamento seguro do Stripe. Assim que confirmar, o sistema do seu bloco fica pronto.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <Label>NOME DO BLOCO</Label>
            <Input
              type="text"
              placeholder="Ex: Bloco Zé Pereira"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>ENDEREÇO DO SISTEMA</Label>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-tl-muted whitespace-nowrap">timelabs.app/</span>
              <Input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(slugify(e.target.value))
                }}
                required
                className="py-2"
              />
            </div>
          </div>

          <div>
            <Label>CIDADE (OPCIONAL)</Label>
            <Input type="text" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>

          <div>
            <Label>SEU NOME</Label>
            <Input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          </div>

          <div>
            <Label>SEU E-MAIL</Label>
            <Input
              type="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>SEU WHATSAPP</Label>
            <Input
              type="tel"
              placeholder="11999990000"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
            />
            <p className="text-[11px] text-tl-muted mt-1.5 leading-relaxed">
              Assim que o pagamento confirmar, seu login de diretor é criado com esse e-mail e os 6
              últimos dígitos do WhatsApp como senha.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>COR PRINCIPAL</Label>
              <ColorField value={primary} onChange={setPrimary} />
            </div>
            <div>
              <Label>COR DE DESTAQUE</Label>
              <ColorField value={accent} onChange={setAccent} />
            </div>
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

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 border-2 border-tl-ink rounded-md bg-white px-2 py-1.5">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border-0 p-0 bg-transparent cursor-pointer"
      />
      <span className="text-xs font-mono text-tl-muted uppercase">{value}</span>
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
