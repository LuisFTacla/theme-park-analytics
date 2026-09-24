import { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { EmptyState } from '@/components/ui';
import { waitTimeColor } from '@/utils';
import type { RideHistoricalProfilePoint } from '@/types';

interface Props {
  historicalProfile: RideHistoricalProfilePoint[] | null;
}

export function RideHourlyChart({ historicalProfile }: Props) {
  const hourlyAverages = useMemo(() => {
    if (!historicalProfile?.length) return [];

    const byHour = new Map<number, { soma: number; blocos: number }>();
    for (const p of historicalProfile) {
      if (p.wait_time_medio <= 0) continue; // fechado / sem dado no bloco
      const acc = byHour.get(p.hora) ?? { soma: 0, blocos: 0 };
      acc.soma += p.wait_time_medio;
      acc.blocos += 1;
      byHour.set(p.hora, acc);
    }

    return [...byHour.entries()]
      .map(([hora, { soma, blocos }]) => ({ hora, label: `${hora}h`, media: soma / blocos }))
      .sort((a, b) => a.hora - b.hora);
  }, [historicalProfile]);

  if (!hourlyAverages.length) {
    return <EmptyState message="Sem histórico suficiente por horário ainda." />;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={hourlyAverages} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#4a4a6a', fontSize: 11, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#4a4a6a', fontSize: 11, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}m`} />
        <Tooltip
          cursor={{ fill: '#ffffff', fillOpacity: 0.04 }}
          contentStyle={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, fontFamily: 'DM Sans', color: '#fff' }}
          labelStyle={{ color: '#4a4a6a', fontSize: 12 }}
          itemStyle={{ color: '#fff' }}
          formatter={(v: number) => [`${Math.round(v)} min`, 'Média histórica']}
          labelFormatter={(label) => `Horário: ${label}`}
        />
        <Bar dataKey="media" radius={[4, 4, 0, 0]}>
          {hourlyAverages.map(h => (
            <Cell key={h.hora} fill={waitTimeColor(h.media)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
