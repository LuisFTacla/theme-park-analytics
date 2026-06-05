// src/components/HeatmapGrid.tsx

import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { Skeleton, ErrorMessage, EmptyState } from '@/components/ui';
import { waitTimeColor } from '@/utils';
import type { HeatmapInterval } from '@/types';
import { useMemo } from 'react';

interface Props {
  parkId: number;
  date: string;
  interval: HeatmapInterval;
}

export function HeatmapGrid({ parkId, date, interval }: Props) {
  const { data, loading, error } = useQuery(
    () => api.getHeatmap(parkId, date, interval),
    [parkId, date, interval]
  );

  const { rides, times, matrix } = useMemo(() => {
    if (!data?.length) return { rides: [], times: [], matrix: {} };

    const rideSet  = new Set<string>();
    const timeSet  = new Set<string>();
    const map: Record<string, Record<string, number | null>> = {};

    for (const d of data) {
      rideSet.add(d.name);
      timeSet.add(d.label_tempo);
      if (!map[d.name]) map[d.name] = {};
      map[d.name][d.label_tempo] = d.wait_time_medio > 0 ? d.wait_time_medio : null;
    }

    const rides = [...rideSet].sort();
    const times = [...timeSet].sort();

    // Build full matrix (null where no data = closed/unknown)
    const matrix: Record<string, Record<string, number | null>> = {};
    for (const r of rides) {
      matrix[r] = {};
      for (const t of times) {
        matrix[r][t] = map[r]?.[t] ?? null;
      }
    }

    return { rides, times, matrix };
  }, [data]);

  if (loading) return <Skeleton className="h-72 w-full" />;
  if (error)   return <ErrorMessage message={error} />;
  if (!rides.length) return <EmptyState message="Sem dados de atrações para este dia." />;

  const CELL_W  = 28; // px por coluna de tempo
  const CELL_H  = 32; // px por linha de atração
  const LABEL_W = 160;
  const LABEL_H = 40;
  const GAP = 2;

  const svgW = LABEL_W + times.length * (CELL_W + GAP);
  const svgH = LABEL_H + rides.length * (CELL_H + GAP);

  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-xl">
      {/* Legenda */}
      <div className="flex items-center gap-4 mb-3 text-xs font-mono text-brand-muted">
        {[
          { label: 'Vazio',       color: '#4ade80' },
          { label: 'Tranquilo',   color: '#a3e635' },
          { label: 'Médio',       color: '#facc15' },
          { label: 'Movimentado', color: '#fb923c' },
          { label: 'Lotado',      color: '#ef4444' },
          { label: 'Fechado',     color: '#1e1e2e', text: '#4a4a6a' },
        ].map(({ label, color, text }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: color }}
            />
            <span style={{ color: text ?? '#4a4a6a' }}>{label}</span>
          </span>
        ))}
      </div>

      <svg
        width={svgW}
        height={svgH}
        style={{ display: 'block', minWidth: svgW }}
        aria-label="Heatmap de lotação por atração"
      >
        {/* Cabeçalho de horários */}
        {times.map((t, ti) => {
          const x = LABEL_W + ti * (CELL_W + GAP) + CELL_W / 2;
          // Mostra label apenas para horas cheias
          const showLabel = t.endsWith(':00');
          return showLabel ? (
            <text
              key={t}
              x={x}
              y={LABEL_H - 8}
              textAnchor="middle"
              fontSize={9}
              fill="#4a4a6a"
              fontFamily="Space Mono"
            >
              {t}
            </text>
          ) : null;
        })}

        {/* Linhas de atrações */}
        {rides.map((ride, ri) => {
          const y = LABEL_H + ri * (CELL_H + GAP);
          return (
            <g key={ride}>
              {/* Nome da atração */}
              <text
                x={LABEL_W - 8}
                y={y + CELL_H / 2 + 4}
                textAnchor="end"
                fontSize={11}
                fill="#c0c0d0"
                fontFamily="DM Sans"
              >
                {ride.length > 18 ? ride.slice(0, 17) + '…' : ride}
              </text>

              {/* Células */}
              {times.map((t, ti) => {
                const val  = matrix[ride]?.[t] ?? null;
                const fill = val !== null ? waitTimeColor(val) : '#1e1e2e';
                const opacity = val !== null ? 1 : 0.4;
                const cx = LABEL_W + ti * (CELL_W + GAP);

                return (
                  <g key={t}>
                    <rect
                      x={cx}
                      y={y}
                      width={CELL_W}
                      height={CELL_H}
                      rx={4}
                      ry={4}
                      fill={fill}
                      opacity={opacity}
                    >
                      <title>{`${ride} — ${t}: ${val !== null ? `${Math.round(val)} min` : 'Fechado'}`}</title>
                    </rect>
                    {val !== null && CELL_H >= 28 && (
                      <text
                        x={cx + CELL_W / 2}
                        y={y + CELL_H / 2 + 4}
                        textAnchor="middle"
                        fontSize={9}
                        fill="#000000"
                        fontFamily="Space Mono"
                        fontWeight="700"
                        opacity={0.7}
                      >
                        {Math.round(val)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
