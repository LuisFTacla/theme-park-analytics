import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { Skeleton, ErrorMessage, EmptyState, Card } from '@/components/ui';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useMemo, useState } from 'react';

interface Props {
  parkId: number;
}

export function BacktestChart({ parkId }: Props) {
  const { data, loading, error } = useQuery(
    () => api.getBacktest(parkId),
    [parkId]
  );

  const rides = useMemo(
    () => (data ? [...new Set(data.map(d => d.name))].sort() : []),
    [data]
  );
  const [selected, setSelected] = useState('');
  const currentRide = selected || rides[0] || '';

  const maeGeral = useMemo(() => {
    if (!data?.length) return null;
    return data.reduce((acc, d) => acc + d.abs_erro, 0) / data.length;
  }, [data]);

  const periodo = useMemo(() => {
    if (!data?.length) return null;
    const datas = data.map(d => d.data_local).sort();
    return { inicio: datas[0], fim: datas[datas.length - 1] };
  }, [data]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data
      .filter(d => d.name === currentRide)
      .sort((a, b) => a.data_local.localeCompare(b.data_local))
      .map(d => ({
        data: d.data_local.slice(5).split('-').reverse().join('/'), // DD/MM
        real: d.wait_time_real,
        previsto: d.wait_time_previsto,
      }));
  }, [data, currentRide]);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (error) return <ErrorMessage message={error} />;
  if (!data?.length) {
    return (
      <EmptyState message="Sem backtest disponível ainda — rode gerar_backtest.py e carregue o resultado no BigQuery." />
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex flex-col gap-1">
          <span className="font-body text-xs text-brand-muted uppercase tracking-wider">MAE do backtest</span>
          <span className="font-display text-3xl text-brand-red">±{maeGeral!.toFixed(1)} min</span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="font-body text-xs text-brand-muted uppercase tracking-wider">Período coberto</span>
          <span className="font-display text-lg text-white">
            {periodo && `${periodo.inicio.slice(5).split('-').reverse().join('/')} — ${periodo.fim.slice(5).split('-').reverse().join('/')}`}
          </span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="font-body text-xs text-brand-muted uppercase tracking-wider">Previsões avaliadas</span>
          <span className="font-display text-lg text-white">{data.length.toLocaleString('pt-BR')}</span>
        </Card>
      </div>

      {/* Seletor de atração */}
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

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
          <XAxis dataKey="data" tick={{ fill: '#4a4a6a', fontSize: 11, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#4a4a6a', fontSize: 11, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}m`} />
          <Tooltip
            contentStyle={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, fontFamily: 'DM Sans', color: '#fff' }}
            formatter={(v: number, nome: string) => [`${Math.round(v)} min`, nome === 'real' ? 'Real' : 'Previsto']}
          />
          <Legend
            formatter={(value) => (value === 'real' ? 'Real' : 'Previsto')}
            wrapperStyle={{ fontFamily: 'Space Mono', fontSize: 12 }}
          />
          <Line type="monotone" dataKey="real" stroke="#4a4a6a" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="previsto" stroke="#ef233c" strokeWidth={2.5} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}