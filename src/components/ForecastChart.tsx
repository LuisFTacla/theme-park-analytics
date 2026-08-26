import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { Skeleton, ErrorMessage, EmptyState } from '@/components/ui';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { useMemo, useState } from 'react';

interface Props {
  parkId: number;
  days?: number;
}

export function ForecastChart({ parkId, days = 14 }: Props) {
  const { data, loading, error } = useQuery(
    () => api.getForecast(parkId, days),
    [parkId, days]
  );

  const rides = useMemo(
    () => (data ? [...new Set(data.previsoes.map(d => d.name))].sort() : []),
    [data]
  );
  const [selected, setSelected] = useState('');
  const currentRide = selected || rides[0] || '';

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.previsoes
      .filter(d => d.name === currentRide)
      .sort((a, b) => a.data_local.localeCompare(b.data_local))
      .map(d => ({
        data: d.data_local.slice(5).split('-').reverse().join('/'), // DD/MM
        wait: d.pred_wait_time,
      }));
  }, [data, currentRide]);

  if (loading) return <Skeleton className="h-72 w-full" />;
  if (error) return <ErrorMessage message={error} />;
  if (!rides.length) return <EmptyState message="Sem previsão disponível." />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {rides.map(r => (
          <button
            key={r}
            onClick={() => setSelected(r)}
            className={`px-3 py-1.5 rounded-lg text-sm font-body transition-all border ${
              currentRide === r
                ? 'bg-brand-red border-brand-red text-white'
                : 'bg-brand-card border-brand-border text-brand-muted hover:text-white hover:border-brand-muted'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {data && (
        <p className="text-xs font-mono text-brand-muted">
          Erro médio esperado (MAE): ±{data.mae_esperado_val.toFixed(1)} min · previsão a partir de{' '}
          {data.horizonte_minimo_dias} dias de antecedência
        </p>
      )}

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
          <XAxis dataKey="data" tick={{ fill: '#4a4a6a', fontSize: 11, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#4a4a6a', fontSize: 11, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}m`} />
          <Tooltip
            contentStyle={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, fontFamily: 'DM Sans', color: '#fff' }}
            formatter={(v: number) => [`${Math.round(v)} min`, 'Previsão']}
          />
          <Line type="monotone" dataKey="wait" stroke="#ef233c" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}