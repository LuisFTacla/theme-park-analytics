import { useId } from 'react';
import { ResponsiveContainer, ComposedChart, Area, YAxis } from 'recharts';
import { waitTimeGradientDefs } from '@/components/waitTimeGradientDefs';
import type { TrendPoint } from '@/utils/trend';

interface Props {
  points: TrendPoint[];
  height?: number;
  /**
   * Teto do eixo Y compartilhado entre vários sparklines (ex: todas as
   * atrações de um parque) — sem isso, cada um se auto-escala entre seu
   * próprio mínimo/máximo, fazendo uma fila constante em 5min parecer tão
   * "cheia" quanto uma que varia de 5 a 30min.
   */
  maxValue?: number;
}

export function Sparkline({ points, height = 32, maxValue }: Props) {
  const uid = useId().replace(/:/g, '');
  const data = points.map((p) => ({ x: p.minutesFromMidnight, y: p.waitTime }));
  const values = points.map((p) => p.waitTime);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Sem um teto compartilhado, ainda garantimos que a base seja sempre 0 —
  // do contrário o auto-domínio do Recharts usa [min, max] da própria série,
  // exagerando qualquer oscilação pequena.
  const domainTop = maxValue != null ? maxValue * 1.1 : max;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <YAxis hide domain={[0, domainTop]} />
        {waitTimeGradientDefs({ id: uid, min, max })}
        <Area
          type="monotone"
          dataKey="y"
          stroke={`url(#${uid}-stroke)`}
          strokeWidth={1.5}
          fill={`url(#${uid}-fill)`}
          fillOpacity={1}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
