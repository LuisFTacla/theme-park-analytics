import { clamp } from '@/utils';

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: RGB): string {
  const toHex = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// Mesmos checkpoints de cor usados em `waitTimeColor` (calendário/heatmap) —
// aqui interpolados continuamente em vez de bandas com corte abrupto.
const CHECKPOINTS: [number, RGB][] = [
  [0, hexToRgb('#4ade80')],
  [20, hexToRgb('#4ade80')],
  [35, hexToRgb('#a3e635')],
  [50, hexToRgb('#facc15')],
  [65, hexToRgb('#fb923c')],
  [90, hexToRgb('#ef4444')],
];

const MAX_CHECKPOINT = CHECKPOINTS[CHECKPOINTS.length - 1][0];

/** Versão contínua de `waitTimeColor` — mesma paleta, transição suave entre os checkpoints. */
export function interpolateWaitTimeColor(value: number): string {
  const v = clamp(value, 0, MAX_CHECKPOINT);
  for (let i = 0; i < CHECKPOINTS.length - 1; i++) {
    const [v0, c0] = CHECKPOINTS[i];
    const [v1, c1] = CHECKPOINTS[i + 1];
    if (v <= v1) {
      const t = v1 === v0 ? 0 : (v - v0) / (v1 - v0);
      return rgbToHex(lerpRgb(c0, c1, t));
    }
  }
  return rgbToHex(CHECKPOINTS[CHECKPOINTS.length - 1][1]);
}

/** CSS `linear-gradient` com a mesma paleta — usado em legendas/swatches. */
export function waitTimeGradientCss(): string {
  const stops = CHECKPOINTS.map(([value, rgb]) => `${rgbToHex(rgb)} ${(value / MAX_CHECKPOINT) * 100}%`);
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

export interface GradientStop {
  offset: number; // 0..1
  color: string;
}

/**
 * Stops de um gradiente vertical (topo = `max`, base = `min`) pra colorir uma
 * linha/área conforme o valor — mesma paleta do heatmap, sem saltos bruscos.
 */
export function buildWaitTimeGradientStops(min: number, max: number, count = 6): GradientStop[] {
  if (!(max > min)) {
    const color = interpolateWaitTimeColor(max);
    return [{ offset: 0, color }, { offset: 1, color }];
  }
  return Array.from({ length: count }, (_, i) => {
    const offset = i / (count - 1);
    const value = max - offset * (max - min);
    return { offset, color: interpolateWaitTimeColor(value) };
  });
}
