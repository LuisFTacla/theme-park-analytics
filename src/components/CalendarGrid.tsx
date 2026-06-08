import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { Skeleton, ErrorMessage } from '@/components/ui';
import { waitTimeColor, MONTH_NAMES_PT, DAY_LABELS_PT } from '@/utils';
import { useState, useMemo } from 'react';
import type { DailyAverage } from '@/types';

interface Props {
  parkId: number;
}

function MonthCard({ days, month, year }: { days: DailyAverage[]; month: number; year: number }) {
  const CELL = 36; // px
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
      <svg width={svgW} height={svgH} style={{ display: 'block' }}>
        {/* Cabeçalho dos dias */}
        {DAY_LABELS_PT.map((label, i) => (
          <text
            key={label}
            x={i * (CELL + GAP) + CELL / 2}
            y={14}
            textAnchor="middle"
            fontSize={9}
            fill="#4a4a6a"
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
                  fill="#111118" opacity={0.3} />
              );
            }

            const fill = waitTimeColor(day.wait_time);
            return (
              <g key={`${wi}-${di}`}>
                <rect x={x} y={y} width={CELL} height={CELL} rx={6} ry={6} fill={fill}>
                  <title>{`${day.day}/${month} — ${Math.round(day.wait_time)} min`}</title>
                </rect>
                <text
                  x={x + CELL / 2}
                  y={y + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#000"
                  fontFamily="Space Mono"
                  opacity={0.6}
                >
                  {day.day}
                </text>
                <text
                  x={x + CELL / 2}
                  y={y + 26}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#000"
                  fontFamily="Space Mono"
                  fontWeight="700"
                  opacity={0.8}
                >
                  {Math.round(day.wait_time)}m
                </text>
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
  const currentYear = year ?? (data?.years.at(-1) ?? new Date().getFullYear());

  const monthlyData = useMemo(() => {
    if (!data?.data.length) return [];
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return {
        month: m,
        days: data.data.filter(d => d.year === currentYear && d.month === m),
      };
    }).filter(m => m.days.length > 0);
  }, [data, currentYear]);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
    </div>
  );
  if (error) return <ErrorMessage message={error} />;
  if (!data?.years.length) return null;

  return (
    <div className="space-y-6">
      {/* Seletor de ano */}
      <div className="flex gap-2">
        {data.years.map(y => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`
              px-4 py-1.5 rounded-lg font-display text-sm tracking-wider transition-all border
              ${currentYear === y
                ? 'bg-brand-red border-brand-red text-white'
                : 'bg-brand-card border-brand-border text-brand-muted hover:text-white hover:border-brand-muted'}
            `}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-brand-muted">
        {[
          { label: 'Vazio (<20 min)',        color: '#4ade80' },
          { label: 'Tranquilo (20–34 min)',  color: '#a3e635' },
          { label: 'Médio (35–49 min)',      color: '#facc15' },
          { label: 'Movimentado (50–64 min)',color: '#fb923c' },
          { label: 'Lotado (65+ min)',       color: '#ef4444' },
        ].map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>

      {/* Grid de meses */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {monthlyData.map(({ month, days }) => (
          <MonthCard key={month} month={month} year={currentYear} days={days} />
        ))}
      </div>
    </div>
  );
}
