import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { Skeleton, ErrorMessage, EmptyState } from '@/components/ui';
import { waitTimeColor, minutesFromTimeLabel, WAIT_TIME_BANDS } from '@/utils';
import { useTheme } from '@/hooks/useTheme';
import { buildTimeColumnLayout, fitCellWidth } from '@/utils/heatmapLayout';
import { useElementWidth } from '@/hooks/useElementWidth';
import { SHOW_ORDER, SHOW_VENUES } from '@/config/showVenues';
import type { HeatmapInterval } from '@/types';
import { useMemo } from 'react';

const SHOW_LINE_H = 5;
const SHOW_LINE_GAP = 1;

// A grade se ajusta à largura do card: as células encolhem até MIN_CELL_W e
// só abaixo disso a grade volta a rolar na horizontal.
const MIN_CELL_W = 6;
const MAX_CELL_W = 40;
const MIN_CELL_W_FOR_NUMBERS = 22; // abaixo disso o número não cabe na célula
const MIN_HOUR_LABEL_SPACING = 30; // px entre rótulos de hora ("10h")
const NARROW_SCREEN = 640;

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
  const { colors } = useTheme();
  const [containerRef, containerWidth] = useElementWidth<HTMLDivElement>();

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

  const LABEL_W = containerWidth && containerWidth < NARROW_SCREEN ? 96 : 160;
  const maxNameChars = Math.floor((LABEL_W - 8) / 6.2);
  const BASE_LABEL_H = 24; // espaço só pro texto da hora cheia

  // Células muito estreitas ficam com gap de 1px pra sobrar mais área colorida
  const gridWidth = (containerWidth || LABEL_W + times.length * 30) - LABEL_W;
  const roughCellW = fitCellWidth(times, gridWidth, 2, MIN_CELL_W, MAX_CELL_W);
  const GAP = roughCellW < 10 ? 1 : 2;
  const CELL_W = fitCellWidth(times, gridWidth, GAP, MIN_CELL_W, MAX_CELL_W);
  const showNumbers = CELL_W >= MIN_CELL_W_FOR_NUMBERS;
  const CELL_H = showNumbers ? 32 : 24;
  const cellRadius = Math.min(4, CELL_W / 4);

  // Com células estreitas, rotula só de N em N horas pra não encavalar
  const hourWidth = (CELL_W + GAP) * (60 / interval) + GAP;
  const hourLabelStep = Math.max(1, Math.ceil(MIN_HOUR_LABEL_SPACING / hourWidth));
  const firstHour = Number(times[0].split(':')[0]);

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
    <div ref={containerRef} className="overflow-x-auto overflow-y-hidden rounded-xl">
      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3 text-xs font-mono text-brand-muted">
        {[...WAIT_TIME_BANDS, { label: 'Fechado', color: colors.border }].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: color }}
            />
            <span>{label}</span>
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
          // Mostra label apenas para horas cheias (de N em N quando apertado)
          const hour = Number(t.split(':')[0]);
          const showLabel = t.endsWith(':00') && (hour - firstHour) % hourLabelStep === 0;
          return showLabel ? (
            <text
              key={t}
              x={x}
              y={BASE_LABEL_H - 8}
              textAnchor="middle"
              fontSize={9}
              fill={colors.subtle}
              fontFamily="Space Mono"
            >
              {hour}h
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
                fill={colors.text}
                fontFamily="DM Sans"
              >
                {ride.length > maxNameChars ? ride.slice(0, maxNameChars - 1) + '…' : ride}
                <title>{ride}</title>
              </text>

              {/* Células */}
              {times.map((t, ti) => {
                const val  = matrix[ride]?.[t] ?? null;
                const fill = val !== null ? waitTimeColor(val) : colors.border;
                const opacity = val !== null ? 1 : 0.4;
                const cx = LABEL_W + columns.x[ti];

                return (
                  <g key={t}>
                    <rect
                      x={cx}
                      y={y}
                      width={CELL_W}
                      height={CELL_H}
                      rx={cellRadius}
                      ry={cellRadius}
                      fill={fill}
                      opacity={opacity}
                    >
                      <title>{`${ride} — ${t}: ${val !== null ? `${Math.round(val)} min` : 'Fechado'}`}</title>
                    </rect>
                    {val !== null && showNumbers && (
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
            <line key={`divider-${t}`} x1={x} y1={LABEL_H} x2={x} y2={svgH} stroke={colors.text} strokeOpacity={0.4} strokeWidth={1} />
          );
        })}
      </svg>
    </div>
  );
}
