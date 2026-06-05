// src/utils/index.ts

/** Mapeia wait_time para uma cor da escala RdYlGn invertida */
export function waitTimeColor(minutes: number): string {
  if (minutes <= 0)  return 'transparent';
  if (minutes < 20)  return '#4ade80'; // verde vivo
  if (minutes < 35)  return '#a3e635'; // verde-limão
  if (minutes < 50)  return '#facc15'; // amarelo
  if (minutes < 65)  return '#fb923c'; // laranja
  return '#ef4444';                    // vermelho
}

/** Label descritivo do tempo de fila */
export function waitTimeLabel(minutes: number): string {
  if (minutes < 20) return 'Vazio';
  if (minutes < 35) return 'Tranquilo';
  if (minutes < 50) return 'Médio';
  if (minutes < 65) return 'Movimentado';
  return 'Lotado';
}

/** Formata uma data para exibição em PT-BR */
export function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
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
