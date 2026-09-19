import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useBloco } from '../lib/bloco'
import { downloadCsv, parseCsvLine, toCsv } from '../lib/csv'
import { Button, Input } from './product/ui'

const EVENT_HEADER_RE = /^(.*?)\s*\((\d{1,2})\/(\d{1,2})\/(\d{4})\)\s*$/

type ParsedEventCol = {
  colIndex: number
  name: string
  date: string // YYYY-MM-DD
  label: string // como veio no cabeçalho, pra mostrar erro se precisar
}

type ParsedRow = {
  full_name: string
  email: string
  present: Set<number> // colIndex dos ensaios marcados
}

type ParsedSheet = {
  events: ParsedEventCol[]
  headerErrors: string[]
  rows: ParsedRow[]
  rowErrors: string[]
}

function parseSheet(text: string): ParsedSheet {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { events: [], headerErrors: [], rows: [], rowErrors: [] }

  const header = parseCsvLine(lines[0])
  const events: ParsedEventCol[] = []
  const headerErrors: string[] = []

  for (let c = 2; c < header.length; c++) {
    const label = header[c]
    if (!label) continue
    const m = label.match(EVENT_HEADER_RE)
    if (!m) {
      headerErrors.push(`Coluna "${label}" — falta a data no formato (DD/MM/AAAA) no fim do nome`)
      continue
    }
    const [, rawName, dd, mm, yyyy] = m
    const name = rawName.trim() || `Ensaio ${dd}/${mm}/${yyyy}`
    const date = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
    events.push({ colIndex: c, name, date, label })
  }

  const rows: ParsedRow[] = []
  const rowErrors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i])
    if (fields.length === 0 || fields.every((f) => !f)) continue
    const full_name = fields[0] ?? ''
    const email = (fields[1] ?? '').toLowerCase()
    if (!email) {
      rowErrors.push(`Linha ${i + 1} (${full_name || 'sem nome'}): e-mail vazio`)
      continue
    }
    const present = new Set<number>()
    for (const ev of events) {
      if ((fields[ev.colIndex] ?? '').trim()) present.add(ev.colIndex)
    }
    rows.push({ full_name, email, present })
  }

  return { events, headerErrors, rows, rowErrors }
}

type Result = {
  eventsCreated: number
  eventsMatched: number
  attendancesMarked: number
  membersNotFound: string[]
}

type Props = {
  onImportComplete: () => void | Promise<void>
  onCancel: () => void
}

export function AttendanceImport({ onImportComplete, onCancel }: Props) {
  const bloco = useBloco()
  const [rawInput, setRawInput] = useState('')
  const [startTime, setStartTime] = useState('19:00')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parsed = useMemo(() => parseSheet(rawInput), [rawInput])
  const totalMarks = useMemo(
    () => parsed.rows.reduce((sum, r) => sum + r.present.size, 0),
    [parsed.rows],
  )

  function handleDownloadTemplate() {
    const csv = toCsv([
      ['Nome', 'Email', 'Ensaio 1 (15/08/2026)', 'Ensaio 2 (22/08/2026)', 'Ensaio 3 (29/08/2026)'],
      ['Maria Silva', 'maria@gmail.com', 'X', '', 'X'],
      ['João Santos', 'joao@gmail.com', 'X', 'X', ''],
      ['Ana Pereira', 'ana@gmail.com', '', 'X', 'X'],
    ])
    downloadCsv('modelo-presencas-antigas.csv', csv)
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
    if (parsed.events.length === 0 || parsed.rows.length === 0) return
    setImporting(true)
    setError(null)
    setResult(null)

    try {
      const { data: membersData, error: membersErr } = await supabase
        .from('members')
        .select('id, email')
        .eq('bloco_id', bloco.id)
      if (membersErr) throw membersErr
      const emailToId = new Map((membersData ?? []).map((m) => [m.email.toLowerCase(), m.id]))

      const { data: existingEvents, error: eventsErr } = await supabase
        .from('events')
        .select('id, name, starts_at')
        .eq('bloco_id', bloco.id)
      if (eventsErr) throw eventsErr
      const eventKey = (name: string, date: string) => `${name}|${date}`
      const existingByKey = new Map(
        (existingEvents ?? []).map((e) => [eventKey(e.name, e.starts_at.slice(0, 10)), e.id]),
      )

      const colToEventId = new Map<number, string>()
      const toCreate = parsed.events.filter((ev) => {
        const existingId = existingByKey.get(eventKey(ev.name, ev.date))
        if (existingId) {
          colToEventId.set(ev.colIndex, existingId)
          return false
        }
        return true
      })

      if (toCreate.length > 0) {
        const [h, m] = startTime.split(':').map(Number)
        const payload = toCreate.map((ev) => {
          const starts = new Date(`${ev.date}T00:00:00`)
          starts.setHours(h || 19, m || 0, 0, 0)
          const ends = new Date(starts.getTime() + 3 * 60 * 60 * 1000)
          return {
            bloco_id: bloco.id,
            name: ev.name,
            starts_at: starts.toISOString(),
            ends_at: ends.toISOString(),
            // ensaio já aconteceu — não tem QR/localização real. O
            // check-in por QR continua protegido pela janela de
            // horário (já passou, então "too_late" sempre).
            latitude: 0,
            longitude: 0,
            radius_meters: 100,
          }
        })
        const { data: created, error: createErr } = await supabase
          .from('events')
          .insert(payload)
          .select('id, name, starts_at')
        if (createErr) throw createErr
        for (const ev of toCreate) {
          const row = (created ?? []).find(
            (c) => c.name === ev.name && c.starts_at.slice(0, 10) === ev.date,
          )
          if (row) colToEventId.set(ev.colIndex, row.id)
        }
      }

      const membersNotFound = new Set<string>()
      const attendanceRows: { event_id: string; member_id: string; source: 'manual' }[] = []
      for (const row of parsed.rows) {
        const memberId = emailToId.get(row.email)
        if (!memberId) {
          membersNotFound.add(row.email)
          continue
        }
        for (const colIndex of row.present) {
          const eventId = colToEventId.get(colIndex)
          if (!eventId) continue
          attendanceRows.push({ event_id: eventId, member_id: memberId, source: 'manual' })
        }
      }

      if (attendanceRows.length > 0) {
        const { error: attErr } = await supabase
          .from('attendances')
          .upsert(attendanceRows, { onConflict: 'event_id,member_id', ignoreDuplicates: true })
        if (attErr) throw attErr
      }

      setResult({
        eventsCreated: toCreate.length,
        eventsMatched: parsed.events.length - toCreate.length,
        attendancesMarked: attendanceRows.length,
        membersNotFound: Array.from(membersNotFound),
      })
      setRawInput('')
      await onImportComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="bg-white border-2 border-bloco-ink rounded-md p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-display text-[11px] tracking-wide text-bloco-ink">
          IMPORTAR PRESENÇAS ANTIGAS
        </h2>
        <button onClick={onCancel} className="text-xs font-bold text-bloco-muted">
          FECHAR
        </button>
      </div>

      <p className="text-xs text-bloco-muted mb-2">
        Pra ensaios que já aconteceram antes de usar o sistema. Cada coluna a partir da terceira é
        um ensaio — o cabeçalho precisa terminar com a data entre parênteses, tipo{' '}
        <code className="bg-bloco-paper px-1 rounded border border-bloco-ink/20">
          Ensaio 1 (15/08/2026)
        </code>
        . Marca presença com qualquer coisa na célula (um X serve). Membros precisam já estar
        cadastrados (cadastre em "Membros" antes, se ainda não fez).
      </p>
      <p className="text-xs text-bloco-muted mb-3">
        Ensaios que já existirem com o mesmo nome e data não são duplicados — a importação só
        adiciona as presenças que faltam.
      </p>

      <div className="flex gap-2 mb-3 flex-wrap items-center">
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
        <div className="flex items-center gap-1.5 ml-auto">
          <label className="text-xs font-bold text-bloco-ink whitespace-nowrap">
            Horário dos ensaios novos:
          </label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-24 py-1"
          />
        </div>
      </div>

      <textarea
        value={rawInput}
        onChange={(e) => {
          setRawInput(e.target.value)
          setResult(null)
        }}
        rows={6}
        placeholder={
          'Nome,Email,Ensaio 1 (15/08/2026),Ensaio 2 (22/08/2026)\nMaria Silva,maria@gmail.com,X,\nJoão Santos,joao@gmail.com,X,X'
        }
        className="w-full px-3 py-2.5 rounded-md border-2 border-bloco-ink bg-white focus:outline-none focus:ring-2 focus:ring-bloco-primary text-sm font-mono"
      />

      {(parsed.events.length > 0 || parsed.rows.length > 0) && (
        <div className="mt-3 text-xs">
          <p className="text-bloco-ink">
            <strong>{parsed.events.length}</strong> ensaio{parsed.events.length === 1 ? '' : 's'} ·{' '}
            <strong>{parsed.rows.length}</strong> membro{parsed.rows.length === 1 ? '' : 's'} ·{' '}
            <strong>{totalMarks}</strong> presença{totalMarks === 1 ? '' : 's'} marcada
            {totalMarks === 1 ? '' : 's'}
          </p>
          {parsed.headerErrors.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {parsed.headerErrors.map((e, i) => (
                <li key={i} className="text-bloco-red">
                  {e}
                </li>
              ))}
            </ul>
          )}
          {parsed.rowErrors.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {parsed.rowErrors.slice(0, 5).map((e, i) => (
                <li key={i} className="text-bloco-red">
                  {e}
                </li>
              ))}
              {parsed.rowErrors.length > 5 && (
                <li className="text-bloco-muted">… e mais {parsed.rowErrors.length - 5}</li>
              )}
            </ul>
          )}
        </div>
      )}

      {error && <p className="text-sm font-semibold text-bloco-red mt-3">{error}</p>}

      {result && (
        <div className="mt-3 text-sm bg-bloco-green/20 border-2 border-bloco-ink text-bloco-ink rounded-md p-3">
          <p>
            <strong>{result.eventsCreated}</strong> ensaio{result.eventsCreated === 1 ? '' : 's'}{' '}
            criado{result.eventsCreated === 1 ? '' : 's'}
            {result.eventsMatched > 0 && (
              <>
                {' · '}
                {result.eventsMatched} já existia{result.eventsMatched === 1 ? '' : 'm'}
              </>
            )}
            {' · '}
            <strong>{result.attendancesMarked}</strong> presença
            {result.attendancesMarked === 1 ? '' : 's'} marcada{result.attendancesMarked === 1 ? '' : 's'}.
          </p>
          {result.membersNotFound.length > 0 && (
            <p className="text-xs mt-2">
              {result.membersNotFound.length} e-mail{result.membersNotFound.length === 1 ? '' : 's'}{' '}
              não encontrado{result.membersNotFound.length === 1 ? '' : 's'} entre os membros
              cadastrados: {result.membersNotFound.slice(0, 5).join(', ')}
              {result.membersNotFound.length > 5 && '…'}
            </p>
          )}
        </div>
      )}

      <Button
        onClick={handleImport}
        disabled={importing || parsed.events.length === 0 || parsed.rows.length === 0}
        className="w-full mt-3"
      >
        {importing ? 'IMPORTANDO…' : 'IMPORTAR PRESENÇAS'}
      </Button>
    </div>
  )
}
