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
          <p className="text-sm text-tl-muted mt-6 mb-3 font-semibold">
            Alguma dúvida? Entre em contato conosco via WhatsApp!!
          </p>
          <a
            href={`https://wa.me/5531995970472?text=${encodeURIComponent('Oi! Vi o TimeLabs e tenho uma dúvida antes de cadastrar meu bloco.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md border-2 border-tl-ink bg-[#25D366] text-white font-display text-sm tracking-wide shadow-hard-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.1c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.81-.11-.42-.13-.95-.3-1.64-.6-2.88-1.24-4.76-4.15-4.9-4.34-.14-.19-1.17-1.56-1.17-2.98 0-1.42.74-2.11 1-2.4.26-.29.58-.36.77-.36h.55c.18 0 .42-.07.65.5.24.58.82 2 .89 2.14.07.14.12.31.02.5-.09.19-.14.31-.28.47-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.86-1.07.18-.28.36-.23.6-.14.24.09 1.55.73 1.82.86.27.14.44.2.51.31.07.12.07.68-.17 1.36z" />
            </svg>
            CHAMAR NO WHATSAPP
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
