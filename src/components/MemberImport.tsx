import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useBloco } from '../lib/bloco'
import { downloadCsv, parseCsvLine, toCsv } from '../lib/csv'
import { Button } from './product/ui'
import { GrupoPicker } from './GrupoPicker'
import { parseGrupo, type Grupo } from '../lib/grupo'

type ParsedRow = {
  full_name: string
  email: string
  whatsapp: string
  instrument: string | null
  grupo: Grupo | null // null = usa o grupo escolhido na tela
  valid: boolean
  error?: string
}

type Result = {
  inserted: number
  updated: number
  unchanged: number
  falhas: string[] // nomes de quem não deu pra atualizar
}

type ExistingMember = {
  id: string
  email: string
  full_name: string
  whatsapp: string | null
  instrument: string | null
  grupo: Grupo
}

type MemberPatch = Partial<Pick<ExistingMember, 'full_name' | 'whatsapp' | 'instrument' | 'grupo'>>

const soDigitos = (s: string | null) => (s ?? '').replace(/\D/g, '')

// O que muda num membro que já existe, comparando com a linha da planilha.
// Célula de instrumento vazia NÃO apaga o instrumento (planilha antiga sem
// a coluna não pode zerar todo mundo). WhatsApp compara só os dígitos:
// "(31) 98888-7777" e "31988887777" são o mesmo número. Atenção: trocar o
// WhatsApp de quem ainda usa a senha automática troca a senha (trigger no banco).
function planejarAtualizacao(r: ParsedRow, m: ExistingMember, destino: Grupo): MemberPatch | null {
  const patch: MemberPatch = {
    ...(r.full_name !== m.full_name && { full_name: r.full_name }),
    ...(soDigitos(r.whatsapp) !== soDigitos(m.whatsapp) && { whatsapp: r.whatsapp }),
    ...(destino !== m.grupo && { grupo: destino }),
    // instrumento é coisa da bateria: quem é do coral fica sem
    ...(destino === 'coral'
      ? m.instrument !== null && { instrument: null }
      : r.instrument && r.instrument !== m.instrument && { instrument: r.instrument }),
  }
  return Object.keys(patch).length > 0 ? patch : null
}

const LOTE = 10

// Um update por membro (cada um muda coisas diferentes), 10 de cada vez.
// Devolve o nome de quem falhou, sem parar os outros.
async function aplicarAtualizacoes(
  itens: { id: string; nome: string; patch: MemberPatch }[],
): Promise<string[]> {
  const falhas: string[] = []
  for (let i = 0; i < itens.length; i += LOTE) {
    const lote = itens.slice(i, i + LOTE)
    const res = await Promise.all(
      lote.map((it) => supabase.from('members').update(it.patch).eq('id', it.id)),
    )
    res.forEach(({ error }, j) => {
      if (error) {
        console.error('Falha ao atualizar membro', lote[j].nome, error)
        falhas.push(lote[j].nome)
      }
    })
  }
  return falhas
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// comCoral = false: a coluna Grupo é ignorada (bloco sem coral é todo bateria)
function parseInput(text: string, comCoral: boolean): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return []

  const first = parseCsvLine(lines[0]).map((f) => f.toLowerCase())
  const hasHeader =
    first.includes('email') ||
    first.includes('e-mail') ||
    first.includes('nome') ||
    first.includes('name')
  const start = hasHeader ? 1 : 0

  const rows: ParsedRow[] = []
  for (let i = start; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i])
    if (fields.length === 0 || fields.every((f) => !f)) continue
    const full_name = fields[0] ?? ''
    const email = (fields[1] ?? '').toLowerCase()
    const whatsapp = fields[2] ?? ''
    const instrument = fields[3] ? fields[3] : null
    const grupoLido = comCoral ? parseGrupo(fields[4] ?? '') : null
    const grupo = grupoLido === 'invalido' ? null : grupoLido
    const base = { full_name, email, whatsapp, instrument, grupo }

    if (!full_name && !email) continue
    if (!full_name) {
      rows.push({ ...base, valid: false, error: 'Nome vazio' })
      continue
    }
    if (!email) {
      rows.push({ ...base, valid: false, error: 'E-mail vazio' })
      continue
    }
    if (!EMAIL_RE.test(email)) {
      rows.push({ ...base, valid: false, error: 'E-mail inválido' })
      continue
    }
    if (!whatsapp.trim()) {
      rows.push({ ...base, valid: false, error: 'WhatsApp vazio' })
      continue
    }
    if (grupoLido === 'invalido') {
      rows.push({ ...base, valid: false, error: 'Grupo inválido (use Bateria ou Coral)' })
      continue
    }
    rows.push({ ...base, valid: true })
  }
  return rows
}

type Props = {
  onImportComplete: () => void | Promise<void>
  onCancel: () => void
}

export function MemberImport({ onImportComplete, onCancel }: Props) {
  const bloco = useBloco()
  const [rawInput, setRawInput] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  // grupo de quem está nessa planilha (só aparece em bloco com coral)
  const [grupo, setGrupo] = useState<Grupo>('bateria')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parsed = useMemo(() => parseInput(rawInput, bloco.tem_coral), [rawInput, bloco.tem_coral])
  const valid = parsed.filter((r) => r.valid)
  const invalid = parsed.filter((r) => !r.valid)

  // Dedupe within the input itself (last entry wins on email collision)
  const dedupedValid = useMemo(() => {
    const map = new Map<string, ParsedRow>()
    for (const r of valid) map.set(r.email, r)
    return Array.from(map.values())
  }, [valid])

  function handleDownloadTemplate() {
    const csv = toCsv(
      bloco.tem_coral
        ? [
            ['Nome', 'Email', 'WhatsApp', 'Instrumento', 'Grupo'],
            ['Maria Silva', 'maria@gmail.com', '11999990001', 'Surdo de Primeira', 'Bateria'],
            ['João Santos', 'joao@gmail.com', '11988887777', 'Caixa', 'Bateria'],
            ['Ana Pereira', 'ana@gmail.com', '31988887777', '', 'Coral'],
          ]
        : [
            ['Nome', 'Email', 'WhatsApp', 'Instrumento'],
            ['Maria Silva', 'maria@gmail.com', '11999990001', 'Surdo de Primeira'],
            ['João Santos', 'joao@gmail.com', '11988887777', 'Caixa'],
            ['Ana Pereira', 'ana@gmail.com', '31988887777', ''],
          ],
    )
    downloadCsv('modelo-cadastro-membros.csv', csv)
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setRawInput(String(reader.result ?? ''))
      setResult(null)
    }
    reader.readAsText(file, 'utf-8')
  }

  async function handleImport() {
    if (dedupedValid.length === 0) return
    setImporting(true)
    setError(null)
    setResult(null)

    const { data: existing, error: e1 } = await supabase
      .from('members')
      .select('id, email, full_name, whatsapp, instrument, grupo')
      .eq('bloco_id', bloco.id)
    if (e1) {
      setError(e1.message)
      setImporting(false)
      return
    }
    const existingByEmail = new Map(
      ((existing ?? []) as ExistingMember[]).map((m) => [m.email.toLowerCase(), m]),
    )

    // Grupo de cada linha: o da coluna Grupo, ou o escolhido na tela se vazio
    const grupoDe = (r: ParsedRow): Grupo => r.grupo ?? grupo

    const toInsert = dedupedValid.filter((r) => !existingByEmail.has(r.email))
    // Já cadastrado: atualiza o que mudou na planilha (nome, WhatsApp,
    // instrumento, grupo). Presenças antigas continuam salvas.
    const toUpdate = dedupedValid.flatMap((r) => {
      const m = existingByEmail.get(r.email)
      const patch = m ? planejarAtualizacao(r, m, grupoDe(r)) : null
      return m && patch ? [{ id: m.id, nome: m.full_name, patch }] : []
    })
    const unchanged = dedupedValid.length - toInsert.length - toUpdate.length

    const falhas = await aplicarAtualizacoes(toUpdate)

    if (toInsert.length > 0) {
      const payload = toInsert.map((r) => ({
        bloco_id: bloco.id,
        full_name: r.full_name,
        email: r.email,
        whatsapp: r.whatsapp,
        instrument: grupoDe(r) === 'coral' ? null : r.instrument,
        role: 'member' as const,
        grupo: grupoDe(r),
      }))

      const { error: e2 } = await supabase.from('members').insert(payload)
      if (e2) {
        setImporting(false)
        setError(e2.message)
        return
      }
    }
    setImporting(false)
    setResult({
      inserted: toInsert.length,
      updated: toUpdate.length - falhas.length,
      unchanged,
      falhas,
    })
    setRawInput('')
    await onImportComplete()
  }

  return (
    <div className="bg-white border-2 border-bloco-ink rounded-md p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-display text-[11px] tracking-wide text-bloco-ink">IMPORTAR PLANILHA</h2>
        <button onClick={onCancel} className="text-xs font-bold text-bloco-muted">
          FECHAR
        </button>
      </div>

      <p className="text-xs text-bloco-muted mb-2">
        Cole ou faça upload de um CSV. Cada linha:{' '}
        <code className="bg-bloco-paper px-1 rounded border border-bloco-ink/20">
          nome,email,whatsapp,instrumento{bloco.tem_coral && ',grupo'}
        </code>{' '}
        (instrumento opcional, whatsapp obrigatório
        {bloco.tem_coral && '; grupo é Bateria ou Coral'}). Cabeçalho é detectado automaticamente. Sem
        certeza do formato? Baixe o modelo abaixo e preencha em cima dele.
      </p>
      <p className="text-xs text-bloco-muted mb-2">
        Quem já está cadastrado (mesmo e-mail) é atualizado com o nome, WhatsApp, instrumento e
        grupo da planilha. Instrumento em branco não apaga o que já existe. Dá pra baixar a lista
        em EXPORTAR PLANILHA DE MEMBROS, editar e subir de volta.
      </p>
      <p className="text-xs text-bloco-muted mb-2">
        O login de cada membro é criado na hora: e-mail + os 6 últimos dígitos do WhatsApp como
        senha inicial.
      </p>
      <p className="text-xs text-bloco-muted mb-3">
        Preencheu num Excel seu (não é o modelo baixado aqui)? Não dá pra subir o <code>.xlsx</code>{' '}
        direto — salve como CSV (Arquivo → Salvar como → CSV) ou selecione as células, copie e
        cole aqui em cima.
      </p>

      {bloco.tem_coral && (
        <div className="mb-3">
          <GrupoPicker label="QUEM ESTIVER SEM GRUPO NA PLANILHA VAI PRA" value={grupo} onChange={setGrupo} />
          <p className="text-xs text-bloco-muted mt-1">
            A coluna Grupo de cada linha manda; se ficar vazia, vai{' '}
            {grupo === 'coral' ? 'pro coral' : 'pra bateria'}. Quem já estiver cadastrado em outro
            grupo é movido. No coral a coluna de instrumento é ignorada.
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs font-bold px-3 py-1.5 rounded-md border-2 border-bloco-ink bg-white hover:bg-bloco-paper"
        >
          CARREGAR ARQUIVO CSV
        </button>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="text-xs font-bold px-3 py-1.5 rounded-md border-2 border-bloco-ink bg-white hover:bg-bloco-paper"
        >
          BAIXAR MODELO
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      <textarea
        value={rawInput}
        onChange={(e) => {
          setRawInput(e.target.value)
          setResult(null)
        }}
        rows={6}
        placeholder={
          'Maria Silva,maria@gmail.com,11999990001,Surdo de Primeira\nJoão Santos,joao@gmail.com,11988887777,Caixa'
        }
        className="w-full px-3 py-2.5 rounded-md border-2 border-bloco-ink bg-white focus:outline-none focus:ring-2 focus:ring-bloco-primary text-sm font-mono"
      />

      {parsed.length > 0 && (
        <div className="mt-3 text-xs">
          <p className="text-bloco-ink">
            <strong>{dedupedValid.length}</strong> linha{dedupedValid.length === 1 ? '' : 's'} válida
            {dedupedValid.length === 1 ? '' : 's'}
            {invalid.length > 0 && (
              <>
                {' · '}
                <span className="text-bloco-red font-bold">
                  <strong>{invalid.length}</strong> com erro
                </span>
              </>
            )}
            {valid.length !== dedupedValid.length && (
              <>
                {' · '}
                <span className="text-bloco-muted">
                  {valid.length - dedupedValid.length} duplicado
                  {valid.length - dedupedValid.length === 1 ? '' : 's'} na lista
                </span>
              </>
            )}
          </p>
          {invalid.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {invalid.slice(0, 5).map((r, i) => (
                <li key={i} className="text-bloco-red">
                  Linha: <span className="font-mono">{r.full_name || '(vazio)'}, {r.email || '(vazio)'}</span> — {r.error}
                </li>
              ))}
              {invalid.length > 5 && (
                <li className="text-bloco-muted">… e mais {invalid.length - 5}</li>
              )}
            </ul>
          )}
        </div>
      )}

      {error && <p className="text-sm font-semibold text-bloco-red mt-3">{error}</p>}

      {result && (
        <div className="mt-3 text-sm bg-bloco-green/20 border-2 border-bloco-ink text-bloco-ink rounded-md p-3">
          <p>
            <strong>{result.inserted}</strong> membro{result.inserted === 1 ? '' : 's'} importado
            {result.inserted === 1 ? '' : 's'}.
          </p>
          {result.updated > 0 && (
            <p className="text-xs mt-1">
              {result.updated} atualizado{result.updated === 1 ? '' : 's'} (já estava
              {result.updated === 1 ? '' : 'm'} cadastrado{result.updated === 1 ? '' : 's'}; nome,
              WhatsApp, instrumento ou grupo mudou).
            </p>
          )}
          {result.unchanged > 0 && (
            <p className="text-xs mt-1">
              {result.unchanged} sem mudança (
              {result.unchanged === 1 ? 'já estava igual' : 'já estavam iguais'} na base).
            </p>
          )}
          {result.falhas.length > 0 && (
            <p className="text-xs mt-1 text-bloco-red font-bold">
              Não deu pra atualizar: {result.falhas.join(', ')}. Tente de novo ou edite na mão.
            </p>
          )}
        </div>
      )}

      <Button
        onClick={handleImport}
        disabled={importing || dedupedValid.length === 0}
        className="w-full mt-3"
      >
        {importing
          ? 'IMPORTANDO…'
          : dedupedValid.length === 0
            ? 'IMPORTAR'
            : `IMPORTAR ${dedupedValid.length} MEMBRO${dedupedValid.length === 1 ? '' : 'S'}`}
      </Button>
    </div>
  )
}
