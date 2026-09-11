import { useMemo } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { Skeleton, ErrorMessage, EmptyState } from '@/components/ui';
import { waitTimeColor } from '@/utils';
import { buildTimeColumnLayout } from '@/utils/heatmapLayout';

interface Props {
  parkId: number;
  rideName: string;
  days?: number;
}

// Granularidade fixa: é uma visão secundária dentro do modal, não precisa de
// seletor próprio como o heatmap grande da aba "Hoje no Parque".
const INTERVAL = 30;

/** "YYYY-MM-DD" -> "DD/MM" */
function shortDateLabel(dateStr: string): string {
  return `${dateStr.slice(8, 10)}/${dateStr.slice(5, 7)}`;
}

export function RideHeatmapHistory({ parkId, rideName, days = 14 }: Props) {
  const { data, loading, error } = useQuery(
    () => api.getRideHeatmapHistory(parkId, rideName, days, INTERVAL),
    [parkId, rideName, days]
  );

  const { dates, times, matrix, avgRow } = useMemo(() => {
    if (!data?.length) return { dates: [] as string[], times: [] as string[], matrix: {} as Record<string, Record<string, number | null>>, avgRow: {} as Record<string, number | null> };

    const dateSet = new Set<string>();
    const timeSet = new Set<string>();
    const raw: Record<string, Record<string, number | null>> = {};

    for (const p of data) {
      dateSet.add(p.data_local);
      timeSet.add(p.label_tempo);
      if (!raw[p.data_local]) raw[p.data_local] = {};
      raw[p.data_local][p.label_tempo] = p.wait_time_medio > 0 ? p.wait_time_medio : null;
    }

    const dates = [...dateSet].sort().reverse(); // mais recente no topo
    const times = [...timeSet].sort();

    const matrix: Record<string, Record<string, number | null>> = {};
    for (const dt of dates) {
      matrix[dt] = {};
      for (const t of times) matrix[dt][t] = raw[dt]?.[t] ?? null;
    }

    const avgRow: Record<string, number | null> = {};
    for (const t of times) {
      const vals = dates.map(dt => matrix[dt][t]).filter((v): v is number => v !== null);
      avgRow[t] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    }

    return { dates, times, matrix, avgRow };
  }, [data]);

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (error) return <ErrorMessage message={error} />;
  if (!dates.length) return <EmptyState message="Sem histórico recente para esta atração." />;

  const CELL_W = 26;
  const CELL_H = 26;
  const LABEL_W = 64;
  const LABEL_H = 28;
  const GAP = 2;
  const AVG_GAP = 10; // espaço extra antes da linha de média, pra "descolar" ela do resto

  // Na fronteira de hora cheia o espaçamento total vira o dobro do normal
  const columns = buildTimeColumnLayout(times, CELL_W, GAP, GAP);
  const svgW = LABEL_W + columns.width;
  const gridH = dates.length * (CELL_H + GAP);
  const svgH = LABEL_H + gridH + AVG_GAP + (CELL_H + GAP);

  const renderCell = (val: number | null, cx: number, y: number, title: string) => {
    const fill = val !== null ? waitTimeColor(val) : '#1e1e2e';
    const opacity = val !== null ? 1 : 0.4;
    return (
      <g key={`${cx}-${y}`}>
        <rect x={cx} y={y} width={CELL_W} height={CELL_H} rx={4} ry={4} fill={fill} opacity={opacity}>
          <title>{title}</title>
        </rect>
      </g>
    );
  };

  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-xl">
      <svg width={svgW} height={svgH} style={{ display: 'block', minWidth: svgW }} aria-label="Heatmap da atração nos últimos dias">
        {/* Cabeçalho de horários */}
        {times.map((t, ti) => {
          const x = LABEL_W + columns.x[ti] + CELL_W / 2;
          if (!t.endsWith(':00')) return null;
          return (
            <text key={t} x={x} y={LABEL_H - 8} textAnchor="middle" fontSize={9} fill="#4a4a6a" fontFamily="Space Mono">
              {t}
            </text>
          );
        })}

        {/* Linhas de dias */}
        {dates.map((dt, di) => {
          const y = LABEL_H + di * (CELL_H + GAP);
          return (
            <g key={dt}>
              <text x={LABEL_W - 8} y={y + CELL_H / 2 + 4} textAnchor="end" fontSize={11} fill="#c0c0d0" fontFamily="Space Mono">
                {shortDateLabel(dt)}
              </text>
              {times.map((t, ti) => {
                const val = matrix[dt]?.[t] ?? null;
                const cx = LABEL_W + columns.x[ti];
                return renderCell(val, cx, y, `${shortDateLabel(dt)} — ${t}: ${val !== null ? `${Math.round(val)} min` : 'Fechado'}`);
              })}
            </g>
          );
        })}

        {/* Linha de média, visualmente separada */}
        <g>
          {(() => {
            const y = LABEL_H + gridH + AVG_GAP;
            return (
              <>
                <text x={LABEL_W - 8} y={y + CELL_H / 2 + 4} textAnchor="end" fontSize={11} fontWeight={700} fill="#ffffff" fontFamily="Space Mono">
                  Média
                </text>
                {times.map((t, ti) => {
                  const val = avgRow[t] ?? null;
                  const cx = LABEL_W + columns.x[ti];
                  return renderCell(val, cx, y, `Média — ${t}: ${val !== null ? `${Math.round(val)} min` : 'Sem dado'}`);
                })}
              </>
            );
          })()}
        </g>

        {/* Divisores de hora cheia — centralizados no espaçamento dobrado */}
        {times.map((t, ti) => {
          if (ti === 0 || !t.endsWith(':00')) return null;
          const x = LABEL_W + columns.x[ti] - GAP;
          return (
            <line key={`divider-${t}`} x1={x} y1={LABEL_H} x2={x} y2={svgH} stroke="#ffffff" strokeOpacity={0.4} strokeWidth={1} />
          );
        })}
      </svg>
    </div>
  );
}
