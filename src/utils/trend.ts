export type TrendDirection = 'up' | 'down' | 'stable';

export interface TrendPoint {
  /** Minutos desde a meia-noite (0–1439) */
  minutesFromMidnight: number;
  waitTime: number;
}

export interface Trend {
  direction: TrendDirection;
  /** Variação (em minutos) entre o ponto de referência e o mais recente */
  deltaMinutes: number;
}

const DEFAULT_WINDOW_MINUTES = 60;
const DEFAULT_THRESHOLD_MINUTES = 5;

/**
 * Compara o ponto mais recente com o mais próximo de `windowMinutes` atrás.
 * Variações dentro de `thresholdMinutes` são tratadas como ruído ("stable").
 * Retorna `null` quando não há histórico próximo o suficiente do horário de
 * referência (ex: parque acabou de abrir) — nesse caso não dá pra confiar na tendência.
 */
export function computeTrend(
  points: TrendPoint[],
  windowMinutes = DEFAULT_WINDOW_MINUTES,
  thresholdMinutes = DEFAULT_THRESHOLD_MINUTES
): Trend | null {
  if (points.length < 2) return null;

  const sorted = [...points].sort((a, b) => a.minutesFromMidnight - b.minutesFromMidnight);
  const latest = sorted[sorted.length - 1];
  const referenceTime = latest.minutesFromMidnight - windowMinutes;

  const reference = sorted
    .slice(0, -1)
    .reduce((closest, point) =>
      Math.abs(point.minutesFromMidnight - referenceTime) <
      Math.abs(closest.minutesFromMidnight - referenceTime)
        ? point
        : closest
    );

  if (Math.abs(reference.minutesFromMidnight - referenceTime) > windowMinutes / 2) {
    return null;
  }

  const deltaMinutes = latest.waitTime - reference.waitTime;
  const direction: TrendDirection =
    deltaMinutes > thresholdMinutes ? 'up'
    : deltaMinutes < -thresholdMinutes ? 'down'
    : 'stable';

  return { direction, deltaMinutes };
}

export const TREND_LABELS_PT: Record<TrendDirection, string> = {
  up: 'Subindo',
  down: 'Caindo',
  stable: 'Estável',
};
