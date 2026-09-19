import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button, Footer } from '../components/ui'

type BlocoPublic = {
  slug: string
  name: string
  city: string | null
  theme: { primary?: string } | null
}

export default function Home() {
  const [blocos, setBlocos] = useState<BlocoPublic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('blocos_public')
      .select('slug, name, city, theme')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error)
        setBlocos(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-full bg-tl-paper">
      {/* hero */}
      <div className="relative overflow-hidden bg-tl-violet">
        <div className="absolute inset-0 bg-halftone opacity-30 [background-size:16px_16px]" />
        <div className="absolute -top-10 -left-10 w-60 h-60 rounded-br-[220px] bg-tl-violet-deep" />
        <div className="absolute -bottom-10 -right-10 w-56 h-68 rounded-tl-[200px] bg-tl-lime" />

        <div className="relative max-w-2xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-block -rotate-2 bg-tl-ink px-4 py-1.5 mb-6">
            <span className="font-display text-[11px] tracking-wider text-tl-lime">
              PRESENÇA DA BATERIA, RESOLVIDA
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05] text-white">
            Check-in de verdade
            <br />
            pro seu bloco
          </h1>
          <p className="text-white/85 text-[15px] mt-5 max-w-md mx-auto leading-relaxed">
            QR code, localização e cadastro de membros — o mesmo sistema que outros blocos já usam
            nos ensaios, com as cores do seu bloco.
          </p>
          <Link
            to="/cadastrar"
            className="inline-block mt-8 px-7 py-3.5 rounded-md border-[2.5px] border-tl-ink bg-tl-lime text-tl-ink font-display text-sm tracking-wide shadow-hard"
          >
            CADASTRE SEU BLOCO
          </Link>
        </div>
      </div>

      {/* blocos já usando */}
      <div className="max-w-2xl mx-auto px-6 py-14">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-display text-sm tracking-wide text-tl-ink">QUEM JÁ USA</h2>
          {!loading && <span className="text-xs text-tl-muted">{blocos.length} bloco{blocos.length === 1 ? '' : 's'}</span>}
        </div>

        {loading ? (
          <p className="text-sm text-tl-muted">Carregando…</p>
        ) : blocos.length === 0 ? (
          <div className="bg-white border-2 border-tl-ink rounded-[10px] p-6 text-center">
            <p className="text-sm text-tl-muted">
              Seu bloco pode ser o primeiro aqui. <Link to="/cadastrar" className="text-tl-violet font-semibold underline">Cadastre agora</Link>.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {blocos.map((b) => (
              <li key={b.slug}>
                <Link
                  to={`/${b.slug}/login`}
                  className="block bg-white border-2 border-tl-ink rounded-[10px] p-4"
                  style={{ boxShadow: `4px 4px 0 ${b.theme?.primary ?? '#7c3aed'}` }}
                >
                  <p className="font-bold text-tl-ink text-sm truncate">{b.name}</p>
                  {b.city && <p className="text-xs text-tl-muted mt-0.5">{b.city}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-12 grid gap-3">
          <Feature
            title="Check-in por QR + localização"
            text="O membro só marca presença se estiver de verdade no ponto de encontro do ensaio."
          />
          <Feature
            title="Cores do seu bloco"
            text="O visual segue a identidade que já funciona pros outros blocos, mas com a sua paleta."
          />
          <Feature
            title="Relatório pronto pra diretoria"
            text="Planilha de presença exportada em um clique, sem depender de caderno ou WhatsApp."
          />
        </div>

        <div className="mt-12 text-center">
          <Button onClick={() => (window.location.href = '/cadastrar')}>
            QUERO PRO MEU BLOCO
          </Button>
          <a
            href={`https://wa.me/5531995970472?text=${encodeURIComponent('Oi! Vi o TimeLabs e tenho uma dúvida antes de cadastrar meu bloco.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-4 text-sm font-semibold text-tl-violet underline"
          >
            Tirar dúvida antes no WhatsApp
          </a>
        </div>

        <Footer />
      </div>
    </div>
  )
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-white border-2 border-tl-ink rounded-[10px] p-4">
      <p className="font-display text-[12.5px] text-tl-violet tracking-wide">{title}</p>
      <p className="text-sm text-tl-muted mt-1.5 leading-relaxed">{text}</p>
    </div>
  )
}
