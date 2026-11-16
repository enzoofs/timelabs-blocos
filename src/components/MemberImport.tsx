import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useBloco } from '../lib/bloco'
import { downloadCsv, parseCsvLine, toCsv } from '../lib/csv'
import { Button } from './product/ui'
import { GrupoPicker } from './GrupoPicker'
import { GRUPO_LABEL, type Grupo } from '../lib/grupo'

type ParsedRow = {
  full_name: string
  email: string
  whatsapp: string
  instrument: string | null
  valid: boolean
  error?: string
}

type Result = {
  inserted: number
  moved: number
  skipped: number
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseInput(text: string): ParsedRow[] {
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

    if (!full_name && !email) continue
    if (!full_name) {
      rows.push({ full_name, email, whatsapp, instrument, valid: false, error: 'Nome vazio' })
      continue
    }
    if (!email) {
      rows.push({ full_name, email, whatsapp, instrument, valid: false, error: 'E-mail vazio' })
      continue
    }
    if (!EMAIL_RE.test(email)) {
      rows.push({ full_name, email, whatsapp, instrument, valid: false, error: 'E-mail inválido' })
      continue
    }
    if (!whatsapp.trim()) {
      rows.push({ full_name, email, whatsapp, instrument, valid: false, error: 'WhatsApp vazio' })
      continue
    }
    rows.push({ full_name, email, whatsapp, instrument, valid: true })
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

  const parsed = useMemo(() => parseInput(rawInput), [rawInput])
  const valid = parsed.filter((r) => r.valid)
  const invalid = parsed.filter((r) => !r.valid)

  // Dedupe within the input itself (last entry wins on email collision)
  const dedupedValid = useMemo(() => {
    const map = new Map<string, ParsedRow>()
    for (const r of valid) map.set(r.email, r)
    return Array.from(map.values())
  }, [valid])

  function handleDownloadTemplate() {
    const csv = toCsv([
      ['Nome', 'Email', 'WhatsApp', 'Instrumento'],
      ['Maria Silva', 'maria@gmail.com', '11999990001', 'Surdo de Primeira'],
      ['João Santos', 'joao@gmail.com', '11988887777', 'Caixa'],
      ['Ana Pereira', 'ana@gmail.com', '31988887777', ''],
    ])
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
      .select('id, email, grupo')
      .eq('bloco_id', bloco.id)
    if (e1) {
      setError(e1.message)
      setImporting(false)
      return
    }
    const existingByEmail = new Map((existing ?? []).map((m) => [m.email.toLowerCase(), m]))

    const toInsert = dedupedValid.filter((r) => !existingByEmail.has(r.email))
    // Já cadastrado em outro grupo: muda pro grupo da planilha (ninguém
    // fica nos dois). Presenças antigas continuam salvas.
    const toMove = dedupedValid
      .map((r) => existingByEmail.get(r.email))
      .filter((m): m is { id: string; email: string; grupo: Grupo } => !!m && m.grupo !== grupo)
    const skipped = dedupedValid.length - toInsert.length - toMove.length

    if (toMove.length > 0) {
      const { error: eMove } = await supabase
        .from('members')
        .update(grupo === 'coral' ? { grupo, instrument: null } : { grupo })
        .in('id', toMove.map((m) => m.id))
      if (eMove) {
        setError(eMove.message)
        setImporting(false)
        return
      }
    }

    if (toInsert.length > 0) {
      const payload = toInsert.map((r) => ({
        bloco_id: bloco.id,
        full_name: r.full_name,
        email: r.email,
        whatsapp: r.whatsapp,
        instrument: grupo === 'coral' ? null : r.instrument,
        role: 'member' as const,
        grupo,
      }))

      const { error: e2 } = await supabase.from('members').insert(payload)
      if (e2) {
        setImporting(false)
        setError(e2.message)
        return
      }
    }
    setImporting(false)
    setResult({ inserted: toInsert.length, moved: toMove.length, skipped })
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
          nome,email,whatsapp,instrumento
        </code>{' '}
        (instrumento opcional, whatsapp obrigatório). Cabeçalho é detectado automaticamente. Sem
        certeza do formato? Baixe o modelo abaixo e preencha em cima dele.
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
          <GrupoPicker label="ESSA PLANILHA É DE" value={grupo} onChange={setGrupo} />
          <p className="text-xs text-bloco-muted mt-1">
            Quem já estiver cadastrado em outro grupo é movido pra{' '}
            {grupo === 'coral' ? 'o coral' : 'a bateria'}.
            {grupo === 'coral' && ' No coral a coluna de instrumento é ignorada.'}
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
          {result.moved > 0 && (
            <p className="text-xs mt-1">
              {result.moved} movido{result.moved === 1 ? '' : 's'} pro grupo{' '}
              {GRUPO_LABEL[grupo]} (já estava{result.moved === 1 ? '' : 'm'} cadastrado
              {result.moved === 1 ? '' : 's'} em outro grupo).
            </p>
          )}
          {result.skipped > 0 && (
            <p className="text-xs mt-1">
              {result.skipped} ignorado{result.skipped === 1 ? '' : 's'} (já existia
              {result.skipped === 1 ? '' : 'm'} na base).
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
