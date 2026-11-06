import type { ThemeColors } from '@/hooks/useTheme';

/** Estilos compartilhados pelos gráficos Recharts, derivados do tema ativo. */
export function chartTheme(colors: ThemeColors) {
  return {
    grid: colors.border,
    tick: { fill: colors.subtle, fontSize: 11, fontFamily: 'Space Mono' },
    tooltip: {
      background: colors.card,
      border: `1px solid ${colors.border}`,
      borderRadius: 12,
      fontFamily: 'DM Sans',
      color: colors.text,
    },
    tooltipLabel: { color: colors.muted, fontSize: 12 },
  };
}
