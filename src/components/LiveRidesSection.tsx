import { useState, useMemo } from "react";
import { useQuery } from "@/hooks/useQuery";
import { api } from "@/services/api";
import { Skeleton, ErrorMessage } from "@/components/ui";
import { waitTimeColor } from "@/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { LiveRide } from "@/types";

interface Props {
  parkId: number;
}

export function LiveRidesSection({ parkId }: Props) {
  const {
    data: rides,
    loading,
    error,
  } = useQuery<LiveRide[]>(() => api.getLive(parkId), [parkId]);

  const [isExpanded, setIsExpanded] = useState(false);

  const processedRides = useMemo(() => {
    if (!rides || rides.length === 0) return [];

    const normalized = rides.map((r) => ({
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
  }, [rides, isExpanded]);

  const metrics = useMemo(() => {
    if (!rides) return { open: 0, closed: 0 };
    const open = rides.filter((r) => r.is_open && r.wait_time > 0).length;
    return { open, closed: rides.length - open };
  }, [rides]);

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
              ? "⚡ Todas as Atrações (Ordem Alfabética)"
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

              return (
                // Cada card entra de forma escalonada
                <motion.div
                  key={ride.id}
                  className={`
                    bg-brand-card border rounded-xl p-4 flex flex-col justify-between min-h-[96px]
                    transition-all duration-300 ease-out
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

                  <div className="flex items-baseline justify-between mt-2">
                    {!isClosed ? (
                      <>
                        <span className="font-mono text-3xl font-bold tracking-tight text-white">
                          {ride.wait_time}
                          <span className="text-xs font-body text-zinc-400 font-normal ml-1">
                            min
                          </span>
                        </span>
                        <span
                          className="w-2.5 h-2.5 rounded-full shadow-sm"
                          style={{ backgroundColor: badgeColor }}
                        />
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
    </div>
  );
}