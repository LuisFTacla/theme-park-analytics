/**
 * Faixas de lotação — fonte única de cor, rótulo e legenda. A escala é a mesma
 * nos dois temas (o texto sobre as células é sempre preto).
 */
export const WAIT_TIME_BANDS = [
  { label: 'Vazio',       range: '<20 min',   upTo: 20,       color: '#34D399' },
  { label: 'Tranquilo',   range: '20–34 min', upTo: 35,       color: '#A3D94A' },
  { label: 'Médio',       range: '35–49 min', upTo: 50,       color: '#FFD21F' },
  { label: 'Movimentado', range: '50–64 min', upTo: 65,       color: '#F7931E' },
  { label: 'Lotado',      range: '65+ min',   upTo: Infinity, color: '#E63946' },
] as const;

function waitTimeBand(minutes: number) {
  return WAIT_TIME_BANDS.find(band => minutes < band.upTo) ?? WAIT_TIME_BANDS[WAIT_TIME_BANDS.length - 1];
}

/** Mapeia wait_time para a cor da faixa de lotação */
export function waitTimeColor(minutes: number): string {
  if (minutes <= 0) return 'transparent';
  return waitTimeBand(minutes).color;
}

/**
 * Raio (em px) do círculo de fila no mapa animado, escalado pelo tempo de
 * espera. Usa raiz quadrada (área do círculo, não o raio, proporcional ao
 * tempo de espera) — é a forma correta de codificar valor por tamanho de
 * círculo em mapa; escala linear de raio faz diferenças pequenas parecerem
 * enormes e as grandes saturarem cedo demais (ex: 90min e 200min batendo no
 * mesmo teto e ficando do mesmo tamanho).
 */
const WAIT_RADIUS_MIN = 11;  // px, tempo de espera > 0
const WAIT_RADIUS_MAX = 44;  // px, no teto da escala (WAIT_RADIUS_REF minutos ou mais)
const WAIT_RADIUS_REF = 200; // minutos que já preenchem o círculo máximo da escala

export function waitTimeRadius(minutes: number): number {
  if (minutes <= 0) return 7;
  const t = clamp(minutes, 0, WAIT_RADIUS_REF) / WAIT_RADIUS_REF;
  return WAIT_RADIUS_MIN + (WAIT_RADIUS_MAX - WAIT_RADIUS_MIN) * Math.sqrt(t);
}

/** Label descritivo do tempo de fila */
export function waitTimeLabel(minutes: number): string {
  return waitTimeBand(minutes).label;
}

/** Formata uma data para exibição em PT-BR */
export function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/** Converte um horário "HH:MM" em minutos desde a meia-noite */
export function minutesFromTimeLabel(label: string): number {
  const [h, m] = label.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Escolhe um rótulo "HH:MM" por hora (o primeiro encontrado) pra usar como
 * tick de eixo X — mais robusto do que filtrar por `endsWith(':00')`, já que
 * a coleta real nem sempre cai exatamente na hora cheia (ex: "10:02", "11:02").
 */
export function pickHourlyTicks(labels: string[]): string[] {
  const seenHours = new Set<string>();
  return labels.filter((label) => {
    const hour = label.split(':')[0];
    if (seenHours.has(hour)) return false;
    seenHours.add(hour);
    return true;
  });
}

/** Retorna o nome do mês em PT-BR */
export const MONTH_NAMES_PT: Record<number, string> = {
  1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
  5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
  9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro',
};

export const DAY_LABELS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const DAY_NAMES_EN  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Clamp numérico */
export const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max);

/** Gera a semana do mês (0-indexed) */
export function weekOfMonth(day: number, month: number, year: number): number {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // ISO: Seg = 0
  return Math.floor((day - 1 + adjustedFirstDay) / 7);
}
