// Grupo do membro/ensaio: bateria ou coral (ver migration 007).
// Só aparece na tela pros blocos com tem_coral = true; nos outros
// tudo é bateria e nada muda.

export type Grupo = 'bateria' | 'coral'

export const GRUPOS: Grupo[] = ['bateria', 'coral']

export const GRUPO_LABEL: Record<Grupo, string> = {
  bateria: 'Bateria',
  coral: 'Coral',
}

// Seletor de grupo nas telas do diretor: 'todos' + os grupos
export type FiltroGrupo = Grupo | 'todos'
