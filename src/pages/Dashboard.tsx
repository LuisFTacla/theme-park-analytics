import { useParams, useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMemo, useEffect } from 'react';
import { Radio, CalendarDays } from 'lucide-react';
// import { LineChart as LineChartIcon } from 'lucide-react'; // ícone da aba "Validação do Modelo", oculta por ora
import { clsx } from 'clsx';
import { EvolutionChart } from '@/components/EvolutionChart';
import { HeatmapGrid } from '@/components/HeatmapGrid';
import { CalendarGrid } from '@/components/CalendarGrid';
import { LiveRidesSection } from '@/components/LiveRidesSection';
import { ShowsSchedule } from '@/components/ShowsSchedule';
import { ParkMapAnimation } from '@/components/ParkMapAnimation';
import { BacktestChart } from '@/components/BacktestChart';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ParkMenu } from '@/components/ParkMenu';
import { Skeleton } from '@/components/ui';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { BETO_CARRERO_PARK_ID } from '@/utils/parkSchedule';
import { TZ_MAP, localDateStr } from '@/config/timezone';
import type { TabId, HeatmapInterval, Park } from '@/types';
// import { LiveStatus } from '@/components/LiveStatus';

const TABS: { id: TabId; label: string; shortLabel: string; icon: React.ReactNode }[] = [
  { id: 'live',       label: 'Hoje no Parque',        shortLabel: 'Hoje',       icon: <Radio size={14} /> },
  { id: 'calendar',   label: 'Calendário de Lotação',  shortLabel: 'Calendário', icon: <CalendarDays size={14} /> },
  // Oculta até o forecast-service estar deployado — { id: 'validation', label: 'Validação do Modelo', icon: <LineChartIcon size={14} /> },
];

/** Título definido no index.html — restaurado ao sair da página do parque. */
const DEFAULT_TITLE = document.title;

const INTERVALS: { label: string; shortLabel: string; value: HeatmapInterval }[] = [
  { label: '1 Hora',     shortLabel: '1h',  value: 60 },
  { label: '30 Minutos', shortLabel: '30m', value: 30 },
  { label: '15 Minutos', shortLabel: '15m', value: 15 },
  { label: '10 Minutos', shortLabel: '10m', value: 10 },
  { label: '5 Minutos',  shortLabel: '5m',  value: 5 },
];

const DEFAULT_TAB: TabId = 'live';
const DEFAULT_INTERVAL: HeatmapInterval = 60;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function Dashboard() {
  const { parkId: parkIdStr } = useParams<{ parkId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const parkId = Number(parkIdStr);

  // Vindo da Home o nome chega no state; por link compartilhado ou F5 não,
  // então busca na lista de parques (rota estática, não consulta o BigQuery).
  const stateName: string | undefined = location.state?.parkName;
  const { data: parks, error: parksError } = useQuery(() => api.getParks(), [], { enabled: !stateName });
  const parkName = stateName
    ?? parks?.find(p => p.park_id === parkId)?.park_name
    ?? (parks || parksError ? `Parque #${parkId}` : null);

  useEffect(() => {
    if (!parkName) return;
    document.title = `${parkName} · Parkometrics`;
    return () => { document.title = DEFAULT_TITLE; };
  }, [parkName]);

  const tz = TZ_MAP[parkId] ?? 'UTC';
  const today = useMemo(() => localDateStr(tz), [tz]);

  // Aba, data e intervalo vivem na URL (?tab=calendar&date=2026-11-01&interval=15):
  // F5, links compartilhados e o botão voltar preservam o que está na tela.
  // Valores padrão ficam fora da URL pra ela continuar curta.
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const tab = TABS.find(t => t.id === tabParam)?.id ?? DEFAULT_TAB;

  const dateParam = searchParams.get('date');
  const date = dateParam && DATE_PATTERN.test(dateParam) && dateParam <= today ? dateParam : today;

  const intervalParam = Number(searchParams.get('interval'));
  const interval = INTERVALS.find(o => o.value === intervalParam)?.value ?? DEFAULT_INTERVAL;

  const updateParams = (changes: Record<string, string | null>, replace: boolean) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(changes)) {
        if (value === null) next.delete(key);
        else next.set(key, value);
      }
      return next;
    }, { replace, state: location.state });
  };

  // Trocar de aba entra no histórico (o "voltar" desfaz); data e intervalo não,
  // senão cada clique no seletor viraria um passo a mais no "voltar".
  const selectTab = (id: TabId) => updateParams({ tab: id === DEFAULT_TAB ? null : id }, false);
  const selectDate = (value: string) => updateParams({ date: value && value !== today ? value : null }, true);
  const selectInterval = (value: HeatmapInterval) =>
    updateParams({ interval: value === DEFAULT_INTERVAL ? null : String(value) }, true);

  // A data não acompanha a troca de parque (cada um tem seu fuso); a aba sim.
  const goToPark = (park: Park) => {
    const query = tab === DEFAULT_TAB ? '' : `?tab=${tab}`;
    navigate(`/park/${park.park_id}${query}`, { state: { parkName: park.park_name } });
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-body">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgb(var(--c-primary) / 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgb(var(--c-primary) / 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-8 pb-16">

        {/* ── Header ── */}
        <header className="mb-8 space-y-6 animate-fade-up" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between gap-4">
            <Link to="/" aria-label="Parkometrics — página inicial" className="flex items-center gap-2.5 group">
              <img src="/parkometrics-marca.svg" alt="" className="h-7 w-auto" />
              <span className="font-display font-bold text-lg">
                Parko<span className="text-brand-primary">metrics</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="hidden sm:block"><ThemeToggle /></span>
              <ParkMenu currentParkId={parkId} onSelectPark={goToPark} />
            </div>
          </div>

          <div>
            <p className="font-display text-[10px] tracking-widest text-brand-primary uppercase mb-1">Parque</p>
            {parkName
              ? <h1 className="font-display text-2xl md:text-3xl font-bold">{parkName}</h1>
              : <Skeleton className="h-8 md:h-9 w-64" />}
          </div>
        </header>

        {/* ── Tabs ── */}
        <div
          className="flex gap-1 bg-brand-card border border-brand-border rounded-xl p-1 mb-8 animate-fade-up"
          style={{ animationDelay: '0.1s', opacity: 0 }}
        >
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => selectTab(t.id)}
              aria-pressed={tab === t.id}
              className={clsx(
                'flex items-center gap-2 flex-1 justify-center px-3 py-2.5 rounded-lg text-sm font-body transition-all',
                tab === t.id
                  ? 'bg-brand-button text-white shadow-lg shadow-brand-primary/20'
                  : 'text-brand-muted hover:text-brand-text'
              )}
            >
              {t.icon}
              <span className="sm:hidden">{t.shortLabel}</span>
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
              <label htmlFor="dashboard-date" className="font-display text-xs tracking-widest text-brand-muted uppercase whitespace-nowrap">
                Data:
              </label>
              <input
                id="dashboard-date"
                type="date"
                value={date}
                max={today}
                onChange={e => selectDate(e.target.value)}
                className="
                  px-3 py-2 rounded-lg bg-brand-card border border-brand-border
                  text-brand-text text-sm font-mono focus:outline-none focus:border-brand-primary/60
                  transition-all
                "
              />
            </div>

            {/* Status ao vivo (apenas hoje) */}
            {/* <LiveStatus parkId={parkId} date={date} today={today} /> */}

            {/* Maiores filas: ao vivo (hoje) ou média + curva do dia (datas passadas) */}
            <LiveRidesSection key={parkId} parkId={parkId} date={date} isToday={date === today} />

            {/* Gráfico de evolução do dia */}
            <section className="animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
              <h2 className="font-display text-sm tracking-widest text-brand-muted uppercase mb-4">
                📈 Evolução Geral das Filas — {date.split('-').reverse().join('/')}
              </h2>
              <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
                <EvolutionChart parkId={parkId} date={date} />
              </div>
            </section>

            {/* Horários de shows do dia — some sozinho se não houver dado */}
            <ShowsSchedule parkId={parkId} date={date} />

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
                      onClick={() => selectInterval(opt.value)}
                      className={clsx(
                        'px-3 py-1.5 rounded-lg text-xs font-mono border transition-all',
                        interval === opt.value
                          ? 'bg-brand-button border-brand-button text-white'
                          : 'bg-brand-card border-brand-border text-brand-muted hover:text-brand-text'
                      )}
                    >
                      <span className="sm:hidden">{opt.shortLabel}</span>
                      <span className="hidden sm:inline">{opt.label}</span>
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
                  <ParkMapAnimation key={parkId} parkId={parkId} date={date} interval={interval} />
                </div>
              </section>
            )}
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
            <CalendarGrid key={parkId} parkId={parkId} />
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