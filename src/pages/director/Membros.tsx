import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useBloco, useBlocoPath, useRefreshBloco } from '../../lib/bloco'
import { MemberImport } from '../../components/MemberImport'
import { Button, Input, PageHeader } from '../../components/product/ui'

type Member = {
  id: string
  email: string
  full_name: string
  whatsapp: string
  instrument: string | null
  auth_user_id: string | null
  role: 'member' | 'director'
}

export default function Membros() {
  const bloco = useBloco()
  const blocoPath = useBlocoPath()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Member | null>(null)
  const [adding, setAdding] = useState(false)
  const [importing, setImporting] = useState(false)
  const [managingInstruments, setManagingInstruments] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    setLoading(true)
    const { data, error } = await supabase
      .from('members')
      .select('id, email, full_name, whatsapp, instrument, auth_user_id, role')
      .eq('bloco_id', bloco.id)
      .order('full_name')
    if (error) console.error(error)
    setMembers((data ?? []) as Member[])
    setLoading(false)
  }

  useEffect(() => {
    void reload()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return members
    return members.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.instrument ?? '').toLowerCase().includes(q),
    )
  }, [members, search])

  async function handleDelete(m: Member) {
    if (!confirm(`Remover ${m.full_name}? As presenças desse membro também serão apagadas.`)) {
      return
    }
    const { error } = await supabase.from('members').delete().eq('id', m.id)
    if (error) {
      alert(error.message)
      return
    }
    await reload()
  }

  return (
    <div className="min-h-full bg-bloco-paper p-6 max-w-md mx-auto">
      <PageHeader
        backTo={blocoPath('/director')}
        title="Membros"
        subtitle={`${members.length} cadastrado${members.length === 1 ? '' : 's'}`}
      />

      <div className="flex gap-2 mb-2">
        <Input
          type="search"
          placeholder="Buscar por nome, e-mail ou instrumento"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          onClick={() => {
            setAdding(true)
            setEditing(null)
            setImporting(false)
            setError(null)
          }}
          className="shrink-0"
        >
          + NOVO
        </Button>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
        <button
          onClick={() => {
            setImporting((v) => !v)
            setManagingInstruments(false)
            setAdding(false)
            setEditing(null)
            setError(null)
          }}
          className="text-xs font-bold text-bloco-accent-text"
        >
          {importing ? 'CANCELAR IMPORTAÇÃO' : 'IMPORTAR PLANILHA DE MEMBROS'}
        </button>
        <button
          onClick={() => {
            setManagingInstruments((v) => !v)
            setImporting(false)
            setAdding(false)
            setEditing(null)
            setError(null)
          }}
          className="text-xs font-bold text-bloco-accent-text"
        >
          {managingInstruments ? 'FECHAR INSTRUMENTOS' : 'GERENCIAR INSTRUMENTOS'}
        </button>
      </div>

      {importing && (
        <MemberImport
          onCancel={() => setImporting(false)}
          onImportComplete={async () => {
            await reload()
          }}
        />
      )}

      {managingInstruments && <InstrumentManager onClose={() => setManagingInstruments(false)} />}

      {(adding || editing) && (
        <MemberForm
          initial={editing ?? undefined}
          onCancel={() => {
            setAdding(false)
            setEditing(null)
            setError(null)
          }}
          onSaved={async () => {
            setAdding(false)
            setEditing(null)
            setError(null)
            await reload()
          }}
          onError={setError}
        />
      )}

      {error && <p className="text-sm font-semibold text-bloco-red mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-bloco-muted">Carregando…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-bloco-muted text-center py-6">
          {members.length === 0 ? 'Nenhum membro ainda.' : 'Nenhum resultado.'}
        </p>
      ) : (
        <ul className="space-y-1">
          {filtered.map((m) => (
            <li
              key={m.id}
              className="flex justify-between items-center gap-2 p-3 rounded-md bg-white border-2 border-bloco-ink"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-bloco-ink truncate">{m.full_name}</p>
                <p className="text-xs text-bloco-muted truncate">
                  {m.email}
                  {m.instrument && ` · ${m.instrument}`}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {m.role === 'director' && (
                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-bloco-accent text-bloco-ink uppercase tracking-wide">
                      diretor
                    </span>
                  )}
                  {!m.auth_user_id && (
                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-bloco-red text-white uppercase tracking-wide">
                      sem login
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => {
                    setEditing(m)
                    setAdding(false)
                    setError(null)
                  }}
                  className="text-[11px] font-bold px-2 py-1 rounded border-2 border-bloco-ink hover:bg-bloco-paper"
                >
                  EDITAR
                </button>
                <button
                  onClick={() => handleDelete(m)}
                  className="text-[11px] font-bold px-2 py-1 rounded border-2 border-bloco-red text-bloco-red hover:bg-bloco-red/10"
                >
                  REMOVER
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

type FormProps = {
  initial?: Member
  onCancel: () => void
  onSaved: () => void | Promise<void>
  onError: (msg: string) => void
}

function MemberForm({ initial, onCancel, onSaved, onError }: FormProps) {
  const bloco = useBloco()
  const [fullName, setFullName] = useState(initial?.full_name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? '')
  const [instrument, setInstrument] = useState(initial?.instrument ?? '')
  const [role, setRole] = useState<Member['role']>(initial?.role ?? 'member')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    onError('')
    const payload = {
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      whatsapp: whatsapp.trim(),
      instrument: instrument.trim() || null,
      role,
    }
    const res = initial
      ? await supabase.from('members').update(payload).eq('id', initial.id)
      : await supabase.from('members').insert({ ...payload, bloco_id: bloco.id })
    setBusy(false)
    if (res.error) {
      onError(res.error.message)
      return
    }
    await onSaved()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border-2 border-bloco-ink rounded-md p-4 mb-4 space-y-3"
    >
      <h2 className="font-display text-[11px] tracking-wide text-bloco-ink">
        {initial ? 'EDITAR MEMBRO' : 'NOVO MEMBRO'}
      </h2>
      <Input
        type="text"
        placeholder="Nome completo"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
      <Input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <div>
        <Input
          type="tel"
          placeholder="WhatsApp"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          required
        />
        <p className="text-xs text-bloco-muted mt-1">
          Obrigatório: os 6 últimos dígitos viram a senha inicial do login do membro.
        </p>
      </div>
      <select
        value={instrument}
        onChange={(e) => setInstrument(e.target.value)}
        className="w-full px-3 py-2.5 rounded-md border-2 border-bloco-ink bg-white text-sm focus:outline-none focus:ring-2 focus:ring-bloco-primary"
      >
        <option value="">Instrumento (opcional)</option>
        {bloco.instruments.map((i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as Member['role'])}
        className="w-full px-3 py-2.5 rounded-md border-2 border-bloco-ink bg-white text-sm focus:outline-none focus:ring-2 focus:ring-bloco-primary"
      >
        <option value="member">Membro</option>
        <option value="director">Diretor</option>
      </select>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>
          CANCELAR
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'SALVANDO…' : 'SALVAR'}
        </Button>
      </div>
    </form>
  )
}

function InstrumentManager({ onClose }: { onClose: () => void }) {
  const bloco = useBloco()
  const refreshBloco = useRefreshBloco()
  const [items, setItems] = useState<string[]>(bloco.instruments)
  const [newItem, setNewItem] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function persist(next: string[]) {
    setBusy(true)
    setError(null)
    const { error: rpcError } = await supabase.rpc('update_bloco_instruments', {
      p_bloco_id: bloco.id,
      p_instruments: next,
    })
    setBusy(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    setItems(next)
    await refreshBloco()
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    const trimmed = newItem.trim()
    if (!trimmed || items.includes(trimmed)) {
      setNewItem('')
      return
    }
    setNewItem('')
    void persist([...items, trimmed])
  }

  function handleRemove(name: string) {
    void persist(items.filter((i) => i !== name))
  }

  return (
    <div className="bg-white border-2 border-bloco-ink rounded-md p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-display text-[11px] tracking-wide text-bloco-ink">INSTRUMENTOS</h2>
        <button onClick={onClose} className="text-xs font-bold text-bloco-muted">
          FECHAR
        </button>
      </div>

      <p className="text-xs text-bloco-muted mb-3">
        Essa lista aparece no cadastro de membro. Adicione ou remova como quiser — não afeta quem
        já está cadastrado com um instrumento antigo.
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-bloco-muted mb-3">Nenhum instrumento cadastrado ainda.</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5 mb-3">
          {items.map((i) => (
            <li
              key={i}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-bloco-paper border-2 border-bloco-ink"
            >
              {i}
              <button
                onClick={() => handleRemove(i)}
                disabled={busy}
                aria-label={`Remover ${i}`}
                className="text-bloco-red font-bold disabled:opacity-50"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm font-semibold text-bloco-red mb-3">{error}</p>}

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          type="text"
          placeholder="Ex: Repique"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <Button type="submit" disabled={busy || !newItem.trim()} className="shrink-0">
          ADICIONAR
        </Button>
      </form>
    </div>
  )
}
