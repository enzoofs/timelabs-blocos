// Grupo do membro/ensaio: bateria ou coral (ver migration 007).
// Só aparece na tela pros blocos com tem_coral = true; nos outros
// tudo é bateria e nada muda.

export type Grupo = 'bateria' | 'coral'

export const GRUPOS: Grupo[] = ['bateria', 'coral']

export const GRUPO_LABEL: Record<Grupo, string> = {
  bateria: 'Bateria',
  coral: 'Coral',
}

// Lê o grupo escrito numa célula da planilha ("Bateria", "coral", "Coral ").
// Vazio → null (vale o grupo escolhido na tela). Texto desconhecido → 'invalido'.
export function parseGrupo(texto: string): Grupo | null | 'invalido' {
  const t = texto.trim().toLowerCase()
  if (!t) return null
  if (t === 'bateria') return 'bateria'
  if (t === 'coral') return 'coral'
  return 'invalido'
}

// Seletor de grupo nas telas do diretor: 'todos' + os grupos
export type FiltroGrupo = Grupo | 'todos'
