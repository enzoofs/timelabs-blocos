// Preço e cálculo de "quanto falta pro Carnaval" — tudo aqui é fácil
// de ajustar depois (valor da mensalidade, desconto do plano à vista).

export const MONTHLY_PRICE = 79.9 // R$ por mês, por bloco
export const LUMP_SUM_DISCOUNT = 0.15 // 15% de desconto pagando até o Carnaval de uma vez

// Data da Páscoa (algoritmo de Meeus/Jones/Butcher) — Carnaval (terça-feira)
// é sempre 47 dias antes da Páscoa.
function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function carnavalTuesday(year: number): Date {
  const d = easterSunday(year)
  d.setDate(d.getDate() - 47)
  return d
}

/** Próxima terça-feira de Carnaval a partir de hoje (ou de `from`). */
export function nextCarnaval(from: Date = new Date()): Date {
  const thisYear = carnavalTuesday(from.getFullYear())
  if (thisYear.getTime() >= stripTime(from).getTime()) return thisYear
  return carnavalTuesday(from.getFullYear() + 1)
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Meses restantes até uma data (arredondado pra cima, mínimo 1). */
export function monthsUntil(target: Date, from: Date = new Date()): number {
  const diffDays = (stripTime(target).getTime() - stripTime(from).getTime()) / 86_400_000
  return Math.max(1, Math.ceil(diffDays / 30))
}

/** Valor à vista até o Carnaval, com desconto, arredondado pra múltiplo de 5. */
export function lumpSumPrice(
  months: number,
  monthly: number = MONTHLY_PRICE,
  discount: number = LUMP_SUM_DISCOUNT,
): number {
  const raw = months * monthly * (1 - discount)
  return Math.max(monthly, Math.round(raw / 5) * 5)
}

export function formatBRL(value: number): string {
  const hasCents = Math.round(value * 100) % 100 !== 0
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })
}

export function formatDatePtBR(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}
