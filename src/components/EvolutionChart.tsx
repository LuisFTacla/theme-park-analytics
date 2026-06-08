import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { Skeleton, ErrorMessage, EmptyState } from '@/components/ui';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

interface Props {
  parkId: number;
  date: string;
}

export function EvolutionChart({ parkId, date }: Props) {
  const { data, loading, error } = useQuery(
    () => api.getEvolution(parkId, date),
    [parkId, date]
  );

  if (loading) return <Skeleton className="h-56 w-full" />;
  if (error)   return <ErrorMessage message={error} />;
  if (!data?.length) return <EmptyState message={`Sem dados para ${date}`} />;

  // Filtra apenas horas cheias no eixo X para não poluir
  const ticks = data.filter(d => d.horario.endsWith(':00')).map(d => d.horario);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ef233c" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef233c" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
        <XAxis
          dataKey="horario"
          ticks={ticks}
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
          formatter={(v: number) => [`${Math.round(v)} min`, 'Espera média']}
          labelStyle={{ color: '#4a4a6a', fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="wait_time"
          stroke="#ef233c"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: '#ef233c', stroke: '#0a0a0f', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
