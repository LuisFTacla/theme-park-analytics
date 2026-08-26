// Calendário de operação do Beto Carrero World (park_id 319).
// A partir de agosto/2026 o parque passou a fechar em datas pontuais
// (normalmente terças/quartas de baixa temporada). NÃO é uma regra de
// dia da semana: feriados que caem nesses dias e os períodos de férias
// (janeiro e julho) mantêm o parque aberto normalmente e por isso ficam
// de fora da lista abaixo. Nesses dias fechados (e fora do horário de
// funcionamento), nenhum dado é mais coletado — mas o app oficial do
// parque às vezes deixa um painel "esquecido" ligado, informando fila
// indevidamente.

export const BETO_CARRERO_PARK_ID = 319;

const BCW_TZ = 'America/Sao_Paulo';
const BCW_OPEN_HOUR = 10;  // inclusive
const BCW_CLOSE_HOUR = 19; // exclusive

// Dias fechados por mês, exatamente como informado pela operação do parque.
const BCW_CLOSED_DAYS_BY_MONTH: Record<string, number[]> = {
  '2026-08': [4, 5, 11, 12, 18, 19, 25, 26],
  '2026-09': [1, 2, 15, 16, 22, 23, 29, 30],
  '2026-10': [6, 7, 20, 21, 27, 28],
  '2026-11': [10, 11, 24, 25],
  '2026-12': [1, 2, 8, 9],
  '2027-04': [6, 7, 13, 14, 27, 28],
  '2027-05': [11, 12, 18, 19],
  '2027-06': [1, 2, 8, 9, 15, 16, 22, 23, 29, 30],
};

const BCW_CLOSED_DATES = new Set<string>(
  Object.entries(BCW_CLOSED_DAYS_BY_MONTH).flatMap(([month, days]) =>
    days.map(day => `${month}-${String(day).padStart(2, '0')}`)
  )
);

function localDateStr(tz: string, date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(date);
}

function localHour(tz: string, date: Date): number {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }).format(date)
  );
  return hour === 24 ? 0 : hour;
}

/**
 * Só aplica a regra de calendário para o Beto Carrero World — não temos
 * essa informação para os demais parques, então eles seguem sempre "abertos".
 */
export function isParkOpenNow(parkId: number, now: Date = new Date()): boolean {
  if (parkId !== BETO_CARRERO_PARK_ID) return true;

  if (BCW_CLOSED_DATES.has(localDateStr(BCW_TZ, now))) return false;

  const hour = localHour(BCW_TZ, now);
  return hour >= BCW_OPEN_HOUR && hour < BCW_CLOSE_HOUR;
}
