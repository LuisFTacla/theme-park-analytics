import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { Skeleton, ErrorMessage } from '@/components/ui';
import { waitTimeColor, MONTH_NAMES_PT, DAY_LABELS_PT, WAIT_TIME_BANDS } from '@/utils';
import { useTheme } from '@/hooks/useTheme';
import { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import type { DailyAverage } from '@/types';

interface Props {
  parkId: number;
}

type Metric = 'wait' | 'shows';

const METRICS: { id: Metric; label: string }[] = [
  { id: 'wait',  label: 'Tempo de fila' },
  { id: 'shows', label: 'Sessões de show' },
];

// Escala sequencial (tons do roxo da paleta) — faixas fixas a partir da
// distribuição real do BCW (8 a 15 sessões/dia). Tons claros pra manter o
// texto preto legível dentro da célula.
const SHOW_SESSION_BANDS = [
  { label: 'Até 9', upTo: 10,       color: '#F3E8FF' },
  { label: '10–11', upTo: 12,       color: '#D8B4FE' },
  { label: '12–13', upTo: 14,       color: '#C084FC' },
  { label: '14+',   upTo: Infinity, color: '#A855F7' },
] as const;

function showSessionsColor(sessions: number): string {
  return (SHOW_SESSION_BANDS.find(b => sessions < b.upTo) ?? SHOW_SESSION_BANDS[SHOW_SESSION_BANDS.length - 1]).color;
}

function MonthCard({ days, month, year, metric }: { days: DailyAverage[]; month: number; year: number; metric: Metric }) {
  const { colors } = useTheme();
  const CELL = 42; // px
  const GAP  = 3;
  const rows = 6;
  const cols = 7;
  const svgW = cols * (CELL + GAP) - GAP;
  const svgH = 24 + rows * (CELL + GAP);

  // Construímos a matriz vazia (6 linhas x 7 colunas)
  const grid: (DailyAverage | null)[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(null)
  );

  // Descobre qual dia da semana caiu o dia 1º DESTE MÊS (0 = Domingo, 1 = Segunda...)
  const firstDayIndex = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  
  // Ajusta o índice para o seu calendário que começa na SEGUNDA-FEIRA:
  // Segunda vira 0, Terça vira 1... Domingo vira 6.
  const shift = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  for (const d of days) {
    // Calculamos a posição exata baseada estritamente no número do dia (d.day)
    const totalIndex = d.day - 1 + shift;
    const weekIndex = Math.floor(totalIndex / 7);
    const dayIndex  = totalIndex % 7; // 0 = Seg, 1 = Ter, ..., 6 = Dom

    if (weekIndex >= 0 && weekIndex < rows && dayIndex >= 0 && dayIndex < cols) {
      grid[weekIndex][dayIndex] = d;
    }
  }

return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
      <h3 className="font-display text-xs tracking-widest text-brand-muted uppercase mb-3">
        {MONTH_NAMES_PT[month]}
      </h3>
      {/* viewBox: o mês acompanha a largura do card (com teto pra não virar um pôster) */}
      <svg viewBox={`0 0 ${svgW} ${svgH}`} width="100%" style={{ display: 'block', maxWidth: 440 }}>
        {/* Cabeçalho dos dias */}
        {DAY_LABELS_PT.map((label, i) => (
          <text
            key={label}
            x={i * (CELL + GAP) + CELL / 2}
            y={14}
            textAnchor="middle"
            fontSize={9}
            fill={colors.subtle}
            fontFamily="Space Mono"
          >
            {label}
          </text>
        ))}

        {/* Células do Calendário */}
        {grid.map((week, wi) =>
          week.map((day, di) => {
            const x = di * (CELL + GAP);
            const y = 24 + wi * (CELL + GAP);

            if (!day) {
              return (
                <rect key={`${wi}-${di}`} x={x} y={y} width={CELL} height={CELL} rx={6} ry={6}
                  fill={colors.border} opacity={0.3} />
              );
            }

            const title = `${day.day}/${month} — ${Math.round(day.wait_time)} min${day.is_forecast ? ' (previsão)' : ''}${day.show_sessions != null ? ` — ${day.show_sessions} sessões de show` : ''}`;
            const dayLabel = (fill: string, opacity: number) => (
              <text x={x + CELL / 2} y={y + 14} textAnchor="middle" fontSize={10} fill={fill} fontFamily="Space Mono" opacity={opacity}>
                {day.day}
              </text>
            );
            const valueLabel = (text: string) => (
              <text x={x + CELL / 2} y={y + 30} textAnchor="middle" fontSize={10} fill="#000" fontFamily="Space Mono" fontWeight="700" opacity={0.8}>
                {text}
              </text>
            );

            if (metric === 'shows') {
              // Sem coleta de shows nesse dia (antes de 24/09/2026 ou previsão): célula neutra
              if (day.show_sessions == null) {
                return (
                  <g key={`${wi}-${di}`}>
                    <rect x={x} y={y} width={CELL} height={CELL} rx={6} ry={6} fill={colors.border} opacity={0.6}>
                      <title>{`${day.day}/${month} — sem dado de shows`}</title>
                    </rect>
                    {dayLabel(colors.subtle, 1)}
                  </g>
                );
              }
              return (
                <g key={`${wi}-${di}`}>
                  <rect x={x} y={y} width={CELL} height={CELL} rx={6} ry={6} fill={showSessionsColor(day.show_sessions)}>
                    <title>{title}</title>
                  </rect>
                  {dayLabel('#000', 0.6)}
                  {valueLabel(String(day.show_sessions))}
                </g>
              );
            }

            const isForecast = day.is_forecast === true;

            return (
              <g key={`${wi}-${di}`}>
                <rect
                  x={x} y={y} width={CELL} height={CELL} rx={6} ry={6}
                  fill={waitTimeColor(day.wait_time)}
                  opacity={isForecast ? 0.55 : 1}
                  stroke={isForecast ? colors.text : 'none'}
                  strokeWidth={isForecast ? 1.2 : 0}
                  strokeDasharray={isForecast ? '3,2' : undefined}
                >
                  <title>{title}</title>
                </rect>
                {dayLabel('#000', 0.6)}
                {valueLabel(`${Math.round(day.wait_time)}m`)}
                {isForecast && (
                  <text
                    x={x + CELL - 5}
                    y={y + 9}
                    textAnchor="end"
                    fontSize={7}
                    fill="#000"
                    fontFamily="Space Mono"
                    fontWeight="700"
                    opacity={0.55}
                  >
                    P
                  </text>
                )}
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}

export function CalendarGrid({ parkId }: Props) {
  const { data, loading, error } = useQuery(
    () => api.getCalendar(parkId),
    [parkId]
  );

  const [year, setYear] = useState<number | null>(null);
  const [metric, setMetric] = useState<Metric>('wait');
  const currentYear = year ?? (data?.years.at(-1) ?? new Date().getFullYear());

  // Shows só são coletados pro BCW (desde 24/09/2026) — sem dado, nem mostra o seletor
  const hasShowData = useMemo(() => !!data?.data.some(d => d.show_sessions != null), [data]);
  const activeMetric: Metric = hasShowData ? metric : 'wait';

  const monthlyData = useMemo(() => {
    if (!data?.data.length) return [];
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return {
        month: m,
        days: data.data.filter(d => d.year === currentYear && d.month === m),
      };
    })
      .filter(m => m.days.length > 0)
      // No modo shows, esconde os meses sem nenhuma coleta (seriam só células cinza)
      .filter(m => activeMetric === 'wait' || m.days.some(d => d.show_sessions != null));
  }, [data, currentYear, activeMetric]);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
    </div>
  );
  if (error) return <ErrorMessage message={error} />;
  if (!data?.years.length) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Seletor de ano */}
      <div className="flex flex-wrap gap-2">
        {data.years.map(y => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`
              px-4 py-1.5 rounded-lg font-display text-sm tracking-wider transition-all border
              ${currentYear === y
                ? 'bg-brand-button border-brand-button text-white'
                : 'bg-brand-card border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-muted'}
            `}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Métrica exibida nas células */}
      {hasShowData && (
        <div className="flex gap-1 p-1 rounded-lg bg-brand-card border border-brand-border" role="group" aria-label="Métrica do calendário">
          {METRICS.map(m => (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              aria-pressed={activeMetric === m.id}
              className={clsx(
                'px-3 py-1.5 rounded-md text-xs font-mono transition-all',
                activeMetric === m.id
                  ? 'bg-brand-button text-white'
                  : 'text-brand-muted hover:text-brand-text'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-brand-muted">
        {activeMetric === 'wait' ? (
          <>
            {WAIT_TIME_BANDS.map(({ label, range, color }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: color }} />
                {label} ({range})
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm inline-block border border-dashed border-brand-text/70"
                style={{ background: WAIT_TIME_BANDS[1].color, opacity: 0.55 }}
              />
              🔮 Previsão (±13 min de margem esperada)
            </span>
          </>
        ) : (
          <>
            <span>Sessões de show por dia:</span>
            {SHOW_SESSION_BANDS.map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: color }} />
                {label}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block bg-brand-border" />
              Sem dado (coleta desde 24/09/2026)
            </span>
          </>
        )}
      </div>

      {/* Grid de meses */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {monthlyData.map(({ month, days }) => (
          <MonthCard key={month} month={month} year={currentYear} days={days} metric={activeMetric} />
        ))}
      </div>
    </div>
  );
}