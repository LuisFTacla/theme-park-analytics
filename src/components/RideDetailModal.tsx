import { useEffect, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ResponsiveContainer, ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { Skeleton, ErrorMessage, EmptyState } from '@/components/ui';
import { formatDateBR, minutesFromTimeLabel, pickHourlyTicks } from '@/utils';
import { waitTimeGradientCss } from '@/utils/waitTimeColorScale';
import { trimToOperatingHours, toOperatingMinutes } from '@/utils/operatingHours';
import { computeTrend, TREND_LABELS_PT, type Trend, type TrendPoint } from '@/utils/trend';
import { RideHeatmapHistory } from '@/components/RideHeatmapHistory';
import { RideHourlyChart } from '@/components/RideHourlyChart';
import { waitTimeGradientDefs } from '@/components/waitTimeGradientDefs';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  parkId: number;
  date: string; // YYYY-MM-DD
  rideName: string;
  onClose: () => void;
}

// Mesma granularidade usada nas duas séries (dia e histórico) — é o que
// permite desenhar a média histórica como uma linha contínua no mesmo eixo
// do dia, em vez de um degrau por hora cheia.
const DETAIL_INTERVAL = 15;

function TrendDisplay({ trend }: { trend: Trend | null }) {
  if (!trend) return <span className="text-brand-muted text-sm font-mono">Dado insuficiente</span>;
  const Icon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;
  const color = trend.direction === 'up' ? '#ef4444' : trend.direction === 'down' ? '#4ade80' : '#94a3b8';
  const sign = trend.deltaMinutes > 0 ? '+' : '';
  return (
    <span className="flex items-center gap-2 font-mono text-sm" style={{ color }}>
      <Icon size={16} />
      {TREND_LABELS_PT[trend.direction]} ({sign}{Math.round(trend.deltaMinutes)} min/h)
    </span>
  );
}

function FactCard({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="bg-brand-dark/40 border border-brand-border rounded-xl p-3">
      <div className="text-[10px] text-brand-muted uppercase tracking-wider mb-1">{label}</div>
      <div className="font-mono text-2xl text-white">{value != null ? `${Math.round(value)} min` : '—'}</div>
    </div>
  );
}

export function RideDetailModal({ parkId, date, rideName, onClose }: Props) {
  const uid = useId().replace(/:/g, '');

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const { data: heatmapToday, loading: loadingDay, error: errorDay } = useQuery(
    () => api.getHeatmap(parkId, date, DETAIL_INTERVAL),
    [parkId, date]
  );

  const { data: historicalProfile } = useQuery(
    () => api.getRideHistoricalProfile(parkId, rideName, DETAIL_INTERVAL),
    [parkId, rideName]
  );

  const { data: stats, loading: loadingStats, error: errorStats } = useQuery(
    () => api.getRideStats(parkId, rideName, date),
    [parkId, rideName, date]
  );

  const daySeries = useMemo(() => {
    // heatmapToday já vem do backend ordenado corretamente (corpo do dia,
    // depois a cauda que virou a madrugada seguinte) — filtrar por atração
    // preserva essa ordem, não precisa reordenar por horário aqui.
    const forRide = (heatmapToday ?? []).filter(p => p.name === rideName);
    return trimToOperatingHours(forRide, p => p.wait_time_medio);
  }, [heatmapToday, rideName]);

  const historicalByLabel = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of historicalProfile ?? []) map.set(p.label_tempo, p.wait_time_medio);
    return map;
  }, [historicalProfile]);

  const chartData = useMemo(
    () => daySeries.map(p => ({
      label: p.label_tempo,
      dia: p.wait_time_medio,
      historico: historicalByLabel.get(p.label_tempo) ?? null,
    })),
    [daySeries, historicalByLabel]
  );

  const ticks = useMemo(() => pickHourlyTicks(chartData.map(d => d.label)), [chartData]);

  const diaRange = useMemo(() => {
    const values = chartData.map(d => d.dia);
    return values.length ? { min: Math.min(...values), max: Math.max(...values) } : { min: 0, max: 0 };
  }, [chartData]);

  const trend = useMemo(() => {
    const points: TrendPoint[] = daySeries
      .filter(p => p.wait_time_medio > 0)
      .map(p => ({ minutesFromMidnight: toOperatingMinutes(minutesFromTimeLabel(p.label_tempo)), waitTime: p.wait_time_medio }));
    return points.length >= 2 ? computeTrend(points) : null;
  }, [daySeries]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto p-4 md:p-8"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-3xl bg-brand-card border border-brand-border rounded-2xl shadow-2xl shadow-black/60 my-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-brand-border sticky top-0 bg-brand-card rounded-t-2xl">
          <h2 className="font-display text-lg font-bold text-white truncate pr-4">{rideName}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-brand-muted hover:text-white hover:bg-brand-border transition-all shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-8">
          {/* Evolução do dia + média histórica por horário */}
          <section>
            <h3 className="font-display text-xs tracking-widest text-brand-muted uppercase mb-3">
              📈 Evolução do Dia — {formatDateBR(date)}
            </h3>
            <div className="flex items-center gap-4 text-xs font-mono text-brand-muted mb-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-sm inline-block" style={{ background: waitTimeGradientCss() }} /> Hoje
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t border-dashed border-brand-muted inline-block" /> Média histórica
              </span>
            </div>
            {loadingDay ? (
              <Skeleton className="h-56 w-full" />
            ) : errorDay ? (
              <ErrorMessage message={errorDay} />
            ) : !chartData.length ? (
              <EmptyState message="Sem dados para hoje." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  {waitTimeGradientDefs({ id: uid, min: diaRange.min, max: diaRange.max })}
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
                  <XAxis
                    dataKey="label"
                    ticks={ticks}
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
                    contentStyle={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12, fontFamily: 'DM Sans', color: '#fff' }}
                    formatter={(v: number, name: string) => [`${Math.round(v)} min`, name === 'dia' ? 'Hoje' : 'Média histórica']}
                    labelStyle={{ color: '#4a4a6a', fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="dia"
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
            )}
          </section>

          {/* Quadro de fatos */}
          <section>
            <h3 className="font-display text-xs tracking-widest text-brand-muted uppercase mb-3">
              📋 Fatos
            </h3>
            {loadingStats ? (
              <Skeleton className="h-24 w-full" />
            ) : errorStats ? (
              <ErrorMessage message={errorStats} />
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <FactCard label="Média histórica" value={stats?.historicalAvg} />
                  <FactCard label="Máxima histórica" value={stats?.historicalMax} />
                  <FactCard label="Média do dia" value={stats?.dailyAvg} />
                  <FactCard label="Máxima do dia" value={stats?.dailyMax} />
                </div>
                <div className="mt-3 flex items-center justify-between bg-brand-dark/40 border border-brand-border rounded-xl p-3">
                  <span className="text-[10px] text-brand-muted uppercase tracking-wider">Tendência agora</span>
                  <TrendDisplay trend={trend} />
                </div>
              </>
            )}
          </section>

          {/* Médias históricas por horário do dia */}
          <section>
            <h3 className="font-display text-xs tracking-widest text-brand-muted uppercase mb-3">
              📊 Movimento por Horário
            </h3>
            <RideHourlyChart historicalProfile={historicalProfile} />
          </section>

          {/* Heatmap dos últimos 14 dias */}
          <section>
            <h3 className="font-display text-xs tracking-widest text-brand-muted uppercase mb-3">
              🌡️ Últimos 14 Dias
            </h3>
            <RideHeatmapHistory parkId={parkId} rideName={rideName} />
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}
