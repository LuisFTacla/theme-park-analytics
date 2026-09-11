import { useState, useMemo } from "react";
import { useQuery } from "@/hooks/useQuery";
import { api } from "@/services/api";
import { Skeleton, ErrorMessage } from "@/components/ui";
import { waitTimeColor, minutesFromTimeLabel } from "@/utils";
import { isParkOpenNow } from "@/utils/parkSchedule";
import { computeTrend, type TrendPoint } from "@/utils/trend";
import { trimToOperatingHours, toOperatingMinutes } from "@/utils/operatingHours";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkline } from "@/components/Sparkline";
import { TrendIndicator } from "@/components/TrendIndicator";
import { RideDetailModal } from "@/components/RideDetailModal";
import type { LiveRide, HeatmapInterval } from "@/types";

interface Props {
  parkId: number;
  date: string; // YYYY-MM-DD, dia atual do parque (fuso local)
}

// Granularidade usada só para o sparkline/tendência de cada card — não é
// configurável pelo usuário, diferente do heatmap grande da aba "Hoje no Parque".
const TREND_INTERVAL: HeatmapInterval = 15;

export function LiveRidesSection({ parkId, date }: Props) {
  const {
    data: rides,
    loading,
    error,
  } = useQuery<LiveRide[]>(() => api.getLive(parkId), [parkId]);

  const { data: heatmap } = useQuery(
    () => api.getHeatmap(parkId, date, TREND_INTERVAL),
    [parkId, date]
  );

  // Série do dia por atração, usada tanto pro sparkline quanto pro cálculo de tendência.
  const seriesByRide = useMemo(() => {
    const raw = new Map<string, TrendPoint[]>();
    if (!heatmap) return raw;
    for (const point of heatmap) {
      if (point.wait_time_medio <= 0) continue; // fechado / sem dado no bloco
      const list = raw.get(point.name) ?? [];
      list.push({ minutesFromMidnight: toOperatingMinutes(minutesFromTimeLabel(point.label_tempo)), waitTime: point.wait_time_medio });
      raw.set(point.name, list);
    }

    // Corta a cauda da madrugada (ex: Extra Magic Hours da noite anterior) —
    // ver utils/operatingHours.ts
    const map = new Map<string, TrendPoint[]>();
    for (const [name, series] of raw) {
      map.set(name, trimToOperatingHours(series, p => p.waitTime));
    }
    return map;
  }, [heatmap]);

  // Teto compartilhado entre os sparklines de todas as atrações, pra que a
  // altura do card reflita a fila de verdade — não só a forma da série.
  const sharedMax = useMemo(() => {
    let max = 0;
    for (const series of seriesByRide.values()) {
      for (const point of series) max = Math.max(max, point.waitTime);
    }
    return max;
  }, [seriesByRide]);

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRide, setSelectedRide] = useState<string | null>(null);

  // O parque pode estar fechado (feriado/dia sem operação ou fora do
  // horário de funcionamento) mesmo que a atração ainda informe fila —
  // nesses casos, ignoramos o dado da API e tratamos tudo como fechado.
  const parkClosed = !isParkOpenNow(parkId);

  const effectiveRides = useMemo(() => {
    if (!rides) return rides;
    if (!parkClosed) return rides;
    return rides.map((r) => ({ ...r, is_open: false, wait_time: 0 }));
  }, [rides, parkClosed]);

  const processedRides = useMemo(() => {
    if (!effectiveRides || effectiveRides.length === 0) return [];

    const normalized = effectiveRides.map((r) => ({
      ...r,
      realIsOpen: r.is_open && r.wait_time > 0,
    }));

    if (!isExpanded) {
      return normalized
        .filter((r) => r.realIsOpen)
        .sort((a, b) => b.wait_time - a.wait_time)
        .slice(0, 4);
    } else {
      return normalized.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    }
  }, [effectiveRides, isExpanded]);

  const metrics = useMemo(() => {
    if (!effectiveRides) return { open: 0, closed: 0 };
    const open = effectiveRides.filter((r) => r.is_open && r.wait_time > 0).length;
    return { open, closed: effectiveRides.length - open };
  }, [effectiveRides]);

  if (loading) return <Skeleton className="h-32 w-full rounded-xl" />;
  if (error) return <ErrorMessage message={error} />;
  if (!rides || rides.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* ─── Linha de Status Geral Macro ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-border/40 pb-4">
        <div className="flex gap-3">
          <span className="flex items-center gap-2 font-display text-xs font-bold tracking-wider text-green-400 bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {metrics.open} Abertas
          </span>
          <span className="flex items-center gap-2 font-display text-xs font-bold tracking-wider text-brand-red bg-brand-red/10 px-3 py-1 rounded-lg border border-brand-red/20">
            <span className="w-2 h-2 rounded-full bg-brand-red" />
            {metrics.closed} Fechadas
          </span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 font-display text-xs tracking-widest text-brand-muted hover:text-white uppercase transition-all duration-300 ease-in-out group"
        >
          {isExpanded ? (
            <>
              Recolher
              <ChevronUp
                size={14}
                className="transition-transform duration-300 group-hover:-translate-y-0.5"
              />
            </>
          ) : (
            <>
              Exibir tudo ({rides.length})
              <ChevronDown
                size={14}
                className="transition-transform duration-300 group-hover:translate-y-0.5"
              />
            </>
          )}
        </button>
      </div>

      {/* ─── Grid de Atrações ─── */}
      <div className="space-y-4">
        {/* Título com animação própria ao trocar */}
        <AnimatePresence mode="wait">
          <motion.h2
            key={isExpanded ? "expanded-title" : "collapsed-title"}
            className="font-display text-xs tracking-widest text-brand-muted uppercase"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.2 }}
          >
            {isExpanded
              ? "⚡ Todas as Atrações"
              : "🔥 Maiores Filas no Momento"}
          </motion.h2>
        </AnimatePresence>

        {/* Grid com saída do conjunto antigo e entrada do novo */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isExpanded ? "expanded" : "collapsed"}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {processedRides.map((ride, index) => {
              const badgeColor = waitTimeColor(ride.wait_time);
              const isClosed = !ride.realIsOpen;
              const series = seriesByRide.get(ride.name) ?? [];
              const trend = !isClosed && series.length >= 2 ? computeTrend(series) : null;

              return (
                // Cada card entra de forma escalonada
                <motion.div
                  key={ride.id}
                  onClick={() => setSelectedRide(ride.name)}
                  role="button"
                  tabIndex={0}
                  className={`
                    bg-brand-card border rounded-xl p-4 flex flex-col justify-between min-h-[132px]
                    cursor-pointer transition-all duration-300 ease-out
                    ${
                      isClosed
                        ? "border-brand-border opacity-40"
                        : "border-brand-border hover:border-brand-muted/40 hover:scale-[1.01] hover:shadow-md"
                    }
                  `}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: isClosed ? 0.4 : 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.25,
                    delay: index * 0.04, // entrada escalonada
                    ease: "easeOut",
                  }}
                >
                  <span className="font-display text-sm font-medium text-zinc-300 line-clamp-1">
                    {ride.name}
                  </span>

                  <div className="h-8 -mx-1">
                    {!isClosed && series.length >= 2 && <Sparkline points={series} maxValue={sharedMax} />}
                  </div>

                  <div className="flex items-baseline justify-between mt-2">
                    {!isClosed ? (
                      <>
                        <span className="font-mono text-3xl font-bold tracking-tight text-white">
                          {ride.wait_time}
                          <span className="text-xs font-body text-zinc-400 font-normal ml-1">
                            min
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          {trend && <TrendIndicator trend={trend} />}
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-sm"
                            style={{ backgroundColor: badgeColor }}
                          />
                        </div>
                      </>
                    ) : (
                      <span className="font-display text-xs tracking-wider text-brand-red font-bold uppercase bg-brand-red/10 px-2 py-0.5 rounded-md border border-brand-red/20">
                        Fechado
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {selectedRide && (
        <RideDetailModal
          parkId={parkId}
          date={date}
          rideName={selectedRide}
          onClose={() => setSelectedRide(null)}
        />
      )}
    </div>
  );
}