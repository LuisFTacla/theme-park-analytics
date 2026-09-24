import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { Skeleton, ErrorMessage, EmptyState } from '@/components/ui';
import { waitTimeColor, minutesFromTimeLabel } from '@/utils';
import { buildTimeColumnLayout } from '@/utils/heatmapLayout';
import { SHOW_ORDER, SHOW_VENUES } from '@/config/showVenues';
import type { HeatmapInterval } from '@/types';
import { useMemo } from 'react';

const SHOW_LINE_H = 5;
const SHOW_LINE_GAP = 1;

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

  // Sem show pra esse parque/dia, `shows` fica vazio e nada é destacado --
  // não precisa de tratamento especial pros parques que não são o BCW.
  const { data: shows } = useQuery(() => api.getShows(parkId, date), [parkId, date]);

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

  // Shows que têm cor definida (exclui o Portal da Escuridão, que não é um
  // show com sessões) e apareceram nesse dia, ordenados pela ordem canônica
  // -- cada um sempre ocupa a mesma raia, esteja ativo ou não numa coluna.
  const presentShowNames = useMemo(() => {
    if (!shows?.length) return [];
    const named = new Set(shows.filter(s => SHOW_VENUES[s.nome]?.color).map(s => s.nome));
    return SHOW_ORDER.filter(name => named.has(name));
  }, [shows]);

  const showLaneIndex = useMemo(
    () => new Map(presentShowNames.map((name, i) => [name, i])),
    [presentShowNames]
  );

  // Por coluna de horário, quais shows (com raia) se sobrepõem a ela.
  const showsByColumn = useMemo(() => {
    const map = new Map<number, string[]>();
    if (!shows?.length || !times.length) return map;

    times.forEach((t, ti) => {
      const blocoInicio = minutesFromTimeLabel(t);
      const blocoFim = blocoInicio + interval;
      const ativos = new Set<string>();
      for (const s of shows) {
        if (!showLaneIndex.has(s.nome)) continue;
        const inicio = minutesFromTimeLabel(s.periodo_de);
        const fim = minutesFromTimeLabel(s.periodo_ate);
        if (inicio < blocoFim && fim > blocoInicio) ativos.add(s.nome);
      }
      if (ativos.size) map.set(ti, [...ativos]);
    });
    return map;
  }, [shows, times, interval, showLaneIndex]);

  if (loading) return <Skeleton className="h-72 w-full" />;
  if (error)   return <ErrorMessage message={error} />;
  if (!rides.length) return <EmptyState message="Sem dados de atrações para este dia." />;

  const CELL_W  = 28; // px por coluna de tempo
  const CELL_H  = 32; // px por linha de atração
  const LABEL_W = 160;
  const BASE_LABEL_H = 24; // espaço só pro texto da hora cheia
  const GAP = 2;

  // Uma raia de altura fixa por show presente no dia, empilhadas logo acima
  // da grade -- por isso o cabeçalho cresce conforme quantos shows diferentes
  // aparecem, não conforme quantos estão ativos numa coluna específica.
  const showsHeaderH = presentShowNames.length > 0
    ? presentShowNames.length * (SHOW_LINE_H + SHOW_LINE_GAP) + 4
    : 0;
  const LABEL_H = BASE_LABEL_H + showsHeaderH;

  // Na fronteira de hora cheia o espaçamento total vira o dobro do normal
  const columns = buildTimeColumnLayout(times, CELL_W, GAP, GAP);
  const svgW = LABEL_W + columns.width;
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
        {presentShowNames.map(name => (
          <span key={name} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-1.5 rounded-sm"
              style={{ background: SHOW_VENUES[name].color }}
            />
            <span>{name}</span>
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
          const x = LABEL_W + columns.x[ti] + CELL_W / 2;
          // Mostra label apenas para horas cheias
          const showLabel = t.endsWith(':00');
          return showLabel ? (
            <text
              key={t}
              x={x}
              y={BASE_LABEL_H - 8}
              textAnchor="middle"
              fontSize={9}
              fill="#4a4a6a"
              fontFamily="Space Mono"
            >
              {t}
            </text>
          ) : null;
        })}

        {/* Raias de shows em cartaz — uma por show, sempre na mesma posição */}
        {[...showsByColumn.entries()].flatMap(([ti, names]) =>
          names.map(name => {
            const lane = showLaneIndex.get(name)!;
            return (
              <rect
                key={`show-${times[ti]}-${name}`}
                x={LABEL_W + columns.x[ti]}
                y={BASE_LABEL_H + lane * (SHOW_LINE_H + SHOW_LINE_GAP)}
                width={CELL_W}
                height={SHOW_LINE_H}
                rx={1.5}
                fill={SHOW_VENUES[name].color}
              >
                <title>{`${name} às ${times[ti]}`}</title>
              </rect>
            );
          })
        )}

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
                const cx = LABEL_W + columns.x[ti];

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
