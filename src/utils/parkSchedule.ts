// Horário de operação do Beto Carrero World (park_id 319).
// Fora do horário de funcionamento o app oficial do parque às vezes deixa
// um painel "esquecido" ligado, informando fila indevidamente.
//
// Dias fechados NÃO são tratados aqui: o parque muda a operação com
// frequência e a antiga lista hard-coded ficou desatualizada (marcava como
// fechados dias em que o parque abriu). Quem decide se o dia é de operação é
// o queue-collector, que consulta ao vivo a API de calendário do parque
// (ver queue-collector/README.md, seção 2).

export const BETO_CARRERO_PARK_ID = 319;

const BCW_TZ = 'America/Sao_Paulo';
const BCW_OPEN_HOUR = 10;  // inclusive
const BCW_CLOSE_HOUR = 19; // exclusive

function localHour(tz: string, date: Date): number {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }).format(date)
  );
  return hour === 24 ? 0 : hour;
}

/**
 * Só aplica a regra de horário para o Beto Carrero World — não temos
 * essa informação para os demais parques, então eles seguem sempre "abertos".
 */
export function isParkOpenNow(parkId: number, now: Date = new Date()): boolean {
  if (parkId !== BETO_CARRERO_PARK_ID) return true;

  const hour = localHour(BCW_TZ, now);
  return hour >= BCW_OPEN_HOUR && hour < BCW_CLOSE_HOUR;
}
