// Precisa ficar em sincronia com OPERATING_DAY_START_HOUR no backend
// (theme-park-analytics-api/src/services/bigquery.service.ts).
const OPERATING_DAY_START_HOUR = 4;

/**
 * Converte "minutos desde a meia-noite" (0-1439, reseta à meia-noite) em
 * "minutos desde o início do dia operacional" (0-1439, onde 0 = 4h da manhã).
 * Necessário sempre que uma série pode incluir a cauda da madrugada seguinte
 * — ela tem minutos "pequenos" (ex: 00:07) mesmo estando por último — e algo
 * for ordenar ou comparar por esse valor (ex: `computeTrend`). Não é preciso
 * pra só desenhar a série num eixo categórico, já que aí quem manda é a
 * ordem do array, não o valor.
 */
export function toOperatingMinutes(clockMinutes: number, dayStartHour = OPERATING_DAY_START_HOUR): number {
  return (clockMinutes - dayStartHour * 60 + 1440) % 1440;
}

// Abaixo disso, tratamos como "fechado" mesmo que não seja zero exato — uma
// única atração com painel travado (ex: relatando "5 min" o dia inteiro,
// sozinha) já é suficiente pra puxar a média do parque pra um valor tipo
// 0,18min sem nunca baixar a zero de verdade.
const CLOSED_THRESHOLD_MINUTES = 1;

/**
 * Apara sequências de zero/fechado que sobrarem nas duas pontas de uma série
 * (parque ainda não abriu / já fechou, mas o dado continua sendo coletado).
 *
 * A atribuição de qual "dia operacional" cada leitura pertence (a virada de
 * dia acontece às 4h da manhã, não à meia-noite — horário em que nenhum
 * parque opera, nem durante o Extra Magic Hours da Disney) já é feita pelo
 * backend, que devolve a série na ordem certa (corpo do dia, depois a cauda
 * que virou a madrugada seguinte). Por isso aqui só resta aparar as pontas
 * por posição — nunca por valor absoluto de horário, já que a cauda tem
 * minutos "pequenos" (ex: 00:07) mesmo estando no fim da série.
 */
export function trimToOperatingHours<T>(
  points: T[],
  getValue: (point: T) => number,
  closedThreshold = CLOSED_THRESHOLD_MINUTES
): T[] {
  const isClosed = (p: T) => getValue(p) < closedThreshold;

  let start = 0;
  while (start < points.length && isClosed(points[start])) start++;

  let end = points.length;
  while (end > start && isClosed(points[end - 1])) end--;

  return points.slice(start, end);
}
