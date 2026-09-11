import { useId } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { Skeleton, ErrorMessage, EmptyState } from '@/components/ui';
import { waitTimeGradientDefs } from '@/components/waitTimeGradientDefs';
import { waitTimeGradientCss } from '@/utils/waitTimeColorScale';
import { pickHourlyTicks, minutesFromTimeLabel } from '@/utils';
import { trimToOperatingHours } from '@/utils/operatingHours';
import {
  ResponsiveContainer, ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

interface Props {
  parkId: number;
  date: string;
}

// Granularidade do perfil histórico — bate com a de outros gráficos do app
// (modal de atração, sparklines) pra manter a mesma "sensação" entre eles.
const HISTORICAL_INTERVAL = 15;

export function EvolutionChart({ parkId, date }: Props) {
  const uid = useId().replace(/:/g, '');
  const { data, loading, error } = useQuery(
    () => api.getEvolution(parkId, date),
    [parkId, date]
  );

  const { data: historicalProfile } = useQuery(
    () => api.getParkHistoricalProfile(parkId, HISTORICAL_INTERVAL),
    [parkId]
  );

  if (loading) return <Skeleton className="h-56 w-full" />;
  if (error)   return <ErrorMessage message={error} />;
  if (!data?.length) return <EmptyState message={`Sem dados para ${date}`} />;

  // Corta a cauda da madrugada (ex: Extra Magic Hours da noite anterior) e
  // apara zeros nas pontas — ver utils/operatingHours.ts
  const trimmedData = trimToOperatingHours(data, d => d.wait_time);
  if (!trimmedData.length) return <EmptyState message={`Sem dados para ${date}`} />;

  // Um rótulo por hora no eixo X para não poluir
  const ticks = pickHourlyTicks(trimmedData.map(d => d.horario));

  const historicalByBlock = new Map<number, number>();
  for (const p of historicalProfile ?? []) {
    historicalByBlock.set(p.hora * 60 + p.minuto_bloco, p.wait_time_medio);
  }

  const chartData = trimmedData.map(d => {
    const block = Math.floor(minutesFromTimeLabel(d.horario) / HISTORICAL_INTERVAL) * HISTORICAL_INTERVAL;
    return {
      horario: d.horario,
      wait_time: d.wait_time,
      historico: historicalByBlock.get(block) ?? null,
    };
  });

  const values = trimmedData.map(d => d.wait_time);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs font-mono text-brand-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-sm inline-block" style={{ background: waitTimeGradientCss() }} /> Hoje
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t border-dashed border-brand-muted inline-block" /> Média histórica
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          {waitTimeGradientDefs({ id: uid, min, max })}
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
          <XAxis
            dataKey="horario"
            ticks={ticks}
            tickFormatter={(label: string) => `${label.split(':')[0]}:00`}
            tick={{ fill: '#4a4a6a', fontSize: 11, fontFamily: 'Space Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15)]}
            tick={{ fill: '#4a4a6a', fontSize: 11, fontFamily: 'Space Mono' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}m`}
          />
          <Tooltip
            contentStyle={{
              background: '#111118',
              border: '1px solid #1e1e2e',
              borderRadius: 12,
              fontFamily: 'DM Sans',
              color: '#fff',
            }}
            formatter={(v: number, name: string) => [`${Math.round(v)} min`, name === 'wait_time' ? 'Hoje' : 'Média histórica']}
            labelStyle={{ color: '#4a4a6a', fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="wait_time"
            stroke={`url(#${uid}-stroke)`}
            strokeWidth={2.5}
            fill={`url(#${uid}-fill)`}
            fillOpacity={1}
            dot={false}
            activeDot={{ r: 5, fill: '#ef233c', stroke: '#0a0a0f', strokeWidth: 2 }}
          />
          <Line type="monotone" dataKey="historico" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 4" dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
