import { GRUPO_LABEL, type FiltroGrupo, type Grupo } from '../lib/grupo'

// Botões lado a lado (Bateria | Coral), usados no formulário de ensaio,
// no cadastro de membro e na importação. Com `comTodos`, vira filtro
// das listas da diretoria (Todos | Bateria | Coral).

type Props<T extends FiltroGrupo> = {
  value: T
  onChange: (g: T) => void
  comTodos?: boolean
  label?: string
}

export function GrupoPicker<T extends FiltroGrupo>({ value, onChange, comTodos, label }: Props<T>) {
  const opcoes = (comTodos ? ['todos', 'bateria', 'coral'] : ['bateria', 'coral']) as T[]
  return (
    <div>
      {label && (
        <p className="block font-display text-[11px] tracking-wide text-bloco-ink mb-1.5">{label}</p>
      )}
      <div role="radiogroup" className="grid gap-1 rounded-md border-2 border-bloco-ink bg-white p-1"
        style={{ gridTemplateColumns: `repeat(${opcoes.length}, minmax(0, 1fr))` }}
      >
        {opcoes.map((g) => (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={value === g}
            onClick={() => onChange(g)}
            className={`text-xs font-bold py-1.5 rounded transition-colors ${
              value === g ? 'bg-bloco-ink text-white' : 'text-bloco-ink hover:bg-bloco-paper'
            }`}
          >
            {g === 'todos' ? 'Todos' : GRUPO_LABEL[g as Grupo]}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Etiqueta pequena com o grupo (lista de ensaios, membros, etc.) */
export function GrupoTag({ grupo }: { grupo: Grupo }) {
  return (
    <span
      className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
        grupo === 'coral' ? 'bg-bloco-primary text-white' : 'bg-stone-200 text-bloco-ink'
      }`}
    >
      {GRUPO_LABEL[grupo]}
    </span>
  )
}
