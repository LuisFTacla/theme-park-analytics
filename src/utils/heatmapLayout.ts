export interface TimeColumnLayout {
  /** posição x (relativa, antes de somar o offset dos rótulos) de cada coluna */
  x: number[];
  /** largura total ocupada pelas colunas de tempo */
  width: number;
}

/**
 * Calcula a posição x de cada coluna de um heatmap por horário, abrindo um
 * respiro extra nas fronteiras de hora cheia. Uma linha fina sozinha nunca
 * tem contraste garantido contra todas as cores do heatmap — um gap físico
 * (fundo aparecendo entre as células) resolve isso independente da cor.
 */
/**
 * Largura de célula que faz as colunas caberem em `availableWidth`, já
 * descontando os gaps (incluindo o gap extra das fronteiras de hora cheia,
 * igual a `buildTimeColumnLayout(times, cellWidth, gap, gap)`). Limitada a
 * [minWidth, maxWidth] — abaixo do mínimo a grade volta a rolar na horizontal.
 */
export function fitCellWidth(
  times: string[],
  availableWidth: number,
  gap: number,
  minWidth: number,
  maxWidth: number
): number {
  if (!times.length) return maxWidth;
  const hourBoundaries = times.filter((t, i) => i > 0 && t.endsWith(':00')).length;
  const totalGaps = (times.length - 1 + hourBoundaries) * gap;
  const width = Math.floor((availableWidth - totalGaps) / times.length);
  return Math.min(maxWidth, Math.max(minWidth, width));
}

export function buildTimeColumnLayout(
  times: string[],
  cellWidth: number,
  gap: number,
  hourGapExtra = 6
): TimeColumnLayout {
  const x: number[] = [];
  let cursor = 0;
  times.forEach((t, i) => {
    if (i > 0) {
      const isHourBoundary = t.endsWith(':00');
      cursor += cellWidth + gap + (isHourBoundary ? hourGapExtra : 0);
    }
    x.push(cursor);
  });
  return { x, width: (times.length ? cursor : 0) + cellWidth };
}
