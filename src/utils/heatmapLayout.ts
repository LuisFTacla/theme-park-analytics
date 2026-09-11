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
