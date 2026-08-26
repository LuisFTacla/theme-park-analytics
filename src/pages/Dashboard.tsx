import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { ArrowLeft, Radio, BarChart2, CalendarDays } from 'lucide-react';
// import { LineChart as LineChartIcon } from 'lucide-react'; // ícone da aba "Validação do Modelo", oculta por ora
import { clsx } from 'clsx';
import { EvolutionChart } from '@/components/EvolutionChart';
import { HeatmapGrid } from '@/components/HeatmapGrid';
import { HourlyChart } from '@/components/HourlyChart';
import { CalendarGrid } from '@/components/CalendarGrid';
import { LiveRidesSection } from '@/components/LiveRidesSection';
import { ParkMapAnimation } from '@/components/ParkMapAnimation';
import { BacktestChart } from '@/components/BacktestChart';
import { BETO_CARRERO_PARK_ID } from '@/utils/parkSchedule';
import type { TabId, HeatmapInterval } from '@/types';
// import { LiveStatus } from '@/components/LiveStatus';

// Fuso horário por park_id — pode vir do backend também
const TZ_MAP: Record<number, string> = {
  319: 'America/Sao_Paulo', 2: 'Europe/London', 4: 'Europe/Paris',
  5: 'America/New_York', 6: 'America/New_York', 7: 'America/New_York',
  8: 'America/New_York', 9: 'Europe/Paris', 15: 'America/New_York',
  16: 'America/Los_Angeles', 17: 'America/Los_Angeles', 21: 'America/New_York',
  24: 'America/New_York', 28: 'Europe/Paris', 32: 'America/Los_Angeles',
  61: 'America/Los_Angeles', 64: 'America/New_York', 65: 'America/New_York',
  66: 'America/Los_Angeles', 334: 'America/New_York',
};

function toLocalDateStr(tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
}

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'live',       label: 'Hoje no Parque',        icon: <Radio size={14} /> },
  { id: 'hourly',     label: 'Movimento por Atração',  icon: <BarChart2 size={14} /> },
  { id: 'calendar',   label: 'Calendário de Lotação',  icon: <CalendarDays size={14} /> },
  // Oculta até o forecast-service estar deployado — { id: 'validation', label: 'Validação do Modelo', icon: <LineChartIcon size={14} /> },
];

const INTERVALS: { label: string; value: HeatmapInterval }[] = [
  { label: '1 Hora',     value: 60 },
  { label: '30 Minutos', value: 30 },
  { label: '15 Minutos', value: 15 },
  { label: '10 Minutos', value: 10 },
  { label: '5 Minutos',  value: 5 },
];

export function Dashboard() {
  const { parkId: parkIdStr } = useParams<{ parkId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const parkId = Number(parkIdStr);
  const parkName: string = location.state?.parkName ?? `Parque #${parkId}`;
  const tz = TZ_MAP[parkId] ?? 'UTC';
  const today = useMemo(() => toLocalDateStr(tz), [tz]);

  const [tab, setTab] = useState<TabId>('live');
  const [date, setDate] = useState<string>(today);
  const [interval, setInterval] = useState<HeatmapInterval>(60);

  return (
    <div className="min-h-screen bg-brand-dark text-white font-body">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(239,35,60,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(239,35,60,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-8 pb-16">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8 animate-fade-up" style={{ opacity: 0 }}>
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg border border-brand-border text-brand-muted hover:text-white hover:border-brand-muted transition-all"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="font-display text-xs tracking-widest text-brand-red uppercase mb-0.5">
              Theme Park Analytics
            </p>
            <h1 className="font-display text-2xl md:text-3xl font-bold">{parkName}</h1>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div
          className="flex gap-1 bg-brand-card border border-brand-border rounded-xl p-1 mb-8 animate-fade-up"
          style={{ animationDelay: '0.1s', opacity: 0 }}
        >
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                'flex items-center gap-2 flex-1 justify-center px-3 py-2.5 rounded-lg text-sm font-body transition-all',
                tab === t.id
                  ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20'
                  : 'text-brand-muted hover:text-white'
              )}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab: Hoje no Parque ── */}
        {tab === 'live' && (
          <div className="space-y-8">
            {/* Seletor de data */}
            <div
              className="flex items-center gap-4 animate-fade-up"
              style={{ animationDelay: '0.15s', opacity: 0 }}
            >
              <label className="font-display text-xs tracking-widest text-brand-muted uppercase whitespace-nowrap">
                Data:
              </label>
              <input
                type="date"
                value={date}
                max={today}
                onChange={e => setDate(e.target.value)}
                className="
                  px-3 py-2 rounded-lg bg-brand-card border border-brand-border
                  text-white text-sm font-mono focus:outline-none focus:border-brand-red/60
                  transition-all
                "
              />
            </div>

            {/* Status ao vivo (apenas hoje) */}
            {/* <LiveStatus parkId={parkId} date={date} today={today} /> */}

            {/* Status ao vivo e Filas (Apenas se a data for hoje) */}
            {date === today ? (
              <LiveRidesSection parkId={parkId} />
            ) : (
              <div className="text-xs font-mono text-brand-muted italic p-4 bg-brand-card rounded-xl border border-brand-border">
                Visualizando dados históricos para o dia {date.split('-').reverse().join('/')}.
              </div>
            )}

            {/* Gráfico de evolução do dia */}
            <section className="animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
              <h2 className="font-display text-sm tracking-widest text-brand-muted uppercase mb-4">
                📈 Evolução Geral das Filas — {date.split('-').reverse().join('/')}
              </h2>
              <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
                <EvolutionChart parkId={parkId} date={date} />
              </div>
            </section>

            {/* Heatmap de atrações */}
            <section className="animate-fade-up" style={{ animationDelay: '0.25s', opacity: 0 }}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="font-display text-sm tracking-widest text-brand-muted uppercase">
                  🌡️ Heatmap de Lotação por Atração
                </h2>
                <div className="flex gap-1">
                  {INTERVALS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setInterval(opt.value)}
                      className={clsx(
                        'px-3 py-1.5 rounded-lg text-xs font-mono border transition-all',
                        interval === opt.value
                          ? 'bg-brand-red border-brand-red text-white'
                          : 'bg-brand-card border-brand-border text-brand-muted hover:text-white'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
                <HeatmapGrid parkId={parkId} date={date} interval={interval} />
              </div>
            </section>

            {/* Mapa animado de filas — coordenadas cadastradas só para o Beto Carrero */}
            {parkId === BETO_CARRERO_PARK_ID && (
              <section className="animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
                <h2 className="font-display text-sm tracking-widest text-brand-muted uppercase mb-4">
                  🗺️ Mapa de Filas — {date.split('-').reverse().join('/')}
                </h2>
                <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
                  <ParkMapAnimation parkId={parkId} date={date} interval={interval} />
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── Tab: Movimento por Atração ── */}
        {tab === 'hourly' && (
          <div
            className="bg-brand-card border border-brand-border rounded-2xl p-6 animate-fade-up"
            style={{ opacity: 0 }}
          >
            <h2 className="font-display text-sm tracking-widest text-brand-muted uppercase mb-6">
              📊 Médias Históricas por Horário
            </h2>
            <HourlyChart parkId={parkId} />
          </div>
        )}

        {/* ── Tab: Calendário ── */}
        {tab === 'calendar' && (
          <div
            className="animate-fade-up"
            style={{ opacity: 0 }}
          >
            <h2 className="font-display text-sm tracking-widest text-brand-muted uppercase mb-6">
              📅 Calendário de Lotação Histórica
            </h2>
            <CalendarGrid parkId={parkId} />
          </div>
        )}

        {/* ── Tab: Validação do Modelo ── */}
        {tab === 'validation' && (
          <div
            className="bg-brand-card border border-brand-border rounded-2xl p-6 animate-fade-up"
            style={{ opacity: 0 }}
          >
            <h2 className="font-display text-sm tracking-widest text-brand-muted uppercase mb-6">
              🔬 Validação do Modelo — Previsto vs. Real (2026)
            </h2>
            <BacktestChart parkId={parkId} />
          </div>
        )}
      </div>
    </div>
  );
}