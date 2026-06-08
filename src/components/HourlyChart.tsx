import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { Skeleton, ErrorMessage, EmptyState } from '@/components/ui';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { useMemo, useState } from 'react';

interface Props {
  parkId: number;
}

export function HourlyChart({ parkId }: Props) {
  const { data, loading, error } = useQuery(
    () => api.getHourlyAverages(parkId),
    [parkId]
  );

  const rides = useMemo(
    () => data ? [...new Set(data.map(d => d.name))].sort() : [],
    [data]
  );

  const [selected, setSelected] = useState<string>('');

  const currentRide = selected || rides[0] || '';

  const chartData = useMemo(() => {
    if (!data) return [];
    return data
      .filter(d => d.name === currentRide)
      .sort((a, b) => a.hora_cheia - b.hora_cheia)
      .map(d => ({
        hora: `${String(d.hora_cheia).padStart(2, '0')}h`,
        wait: Math.round(d.wait_time),
      }));
  }, [data, currentRide]);

  // Top 3 horários de pico
  const top3 = useMemo(() => {
    if (!chartData.length) return new Set<string>();
    const sorted = [...chartData].sort((a, b) => b.wait - a.wait).slice(0, 3);
    return new Set(sorted.map(d => d.hora));
  }, [chartData]);

  if (loading) return <Skeleton className="h-72 w-full" />;
  if (error)   return <ErrorMessage message={error} />;
  if (!rides.length) return <EmptyState message="Sem dados históricos de médias horárias." />;

  return (
    <div className="space-y-5">
      {/* Seletor de atração */}
      <div className="flex flex-wrap gap-2">
        {rides.map(r => (
          <button
            key={r}
            onClick={() => setSelected(r)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-body transition-all border
              ${(currentRide === r)
                ? 'bg-brand-red border-brand-red text-white'
                : 'bg-brand-card border-brand-border text-brand-muted hover:text-white hover:border-brand-muted'}
            `}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Legenda de pico */}
      <div className="flex items-center gap-4 text-xs font-mono text-brand-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-brand-red inline-block" />
          Horário de pico
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#0068c9] inline-block" />
          Outros horários
        </span>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
          <XAxis
            dataKey="hora"
            tick={{ fill: '#4a4a6a', fontSize: 11, fontFamily: 'Space Mono' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
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
            formatter={(v: number) => [`${v} min`, 'Espera média histórica']}
            labelStyle={{ color: '#4a4a6a', fontSize: 12 }}
          />
          <Bar dataKey="wait" radius={[6, 6, 0, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.hora}
                fill={top3.has(entry.hora) ? '#ef233c' : '#0068c9'}
                opacity={top3.has(entry.hora) ? 1 : 0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
