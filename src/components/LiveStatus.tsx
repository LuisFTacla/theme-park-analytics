// src/components/LiveStatus.tsx

import { useLiveData } from '@/hooks/useLiveData';
import { Card, Badge, Skeleton, ErrorMessage } from '@/components/ui';
import { RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  parkId: number;
  date: string;        // YYYY-MM-DD
  today: string;       // YYYY-MM-DD
}

export function LiveStatus({ parkId, date, today }: Props) {
  const { topRides, openRides, closedRides, loading, error, lastUpdated, refetch } = useLiveData(
    date === today ? parkId : null
  );

  if (date !== today) return null;

  return (
    <section className="animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm tracking-widest text-brand-muted uppercase">
          ⚡ Status Agora
        </h2>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="font-mono text-xs text-brand-muted">
              Atualizado às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={refetch}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-brand-border transition-colors text-brand-muted hover:text-white disabled:opacity-40"
          >
            <RefreshCw size={14} className={clsx(loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading && !topRides.length ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          {/* Top 4 filas */}
          {topRides.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {topRides.map((ride, i) => (
                <Card
                  key={ride.id}
                  className={clsx(
                    'flex flex-col gap-1 transition-all',
                    i === 0 && 'border-brand-red/40 bg-brand-red/5'
                  )}
                >
                  <span className="font-body text-xs text-brand-muted truncate">{ride.name}</span>
                  <span className="font-display text-3xl text-white">
                    {ride.wait_time}
                    <span className="text-sm text-brand-muted ml-1">min</span>
                  </span>
                  {i === 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-brand-red font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse-dot" />
                      Maior fila
                    </span>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Contador abertas / fechadas */}
          <div className="flex gap-3">
            <Badge variant="green">✅ {openRides.length} abertas</Badge>
            <Badge variant="red">❌ {closedRides.length} fechadas</Badge>
          </div>
        </>
      )}
    </section>
  );
}
