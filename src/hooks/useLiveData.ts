import { useState, useEffect, useRef } from 'react';
import { api } from '@/services/api';
import type { LiveRide } from '@/types';

const POLL_INTERVAL = 60_000; // 60 segundos

export function useLiveData(parkId: number | null) {
  const [rides, setRides] = useState<LiveRide[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const lastFetchRef = useRef(0);

  const fetchData = async () => {
    if (!parkId) return;
    lastFetchRef.current = Date.now();
    setLoading(true);
    try {
      const data = await api.getLive(parkId);
      setRides(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados ao vivo');
    } finally {
      setLoading(false);
    }
  };

  // Só faz polling com a aba visível: aba esquecida em segundo plano não gasta
  // requisição (nem acorda a API). Ao voltar pra aba, atualiza na hora se o
  // dado já passou do intervalo, e retoma o ciclo normal.
  useEffect(() => {
    if (!parkId) return;
    let timer: ReturnType<typeof setInterval> | undefined;

    const start = () => {
      if (Date.now() - lastFetchRef.current >= POLL_INTERVAL) fetchData();
      timer = setInterval(fetchData, POLL_INTERVAL);
    };
    const stop = () => clearInterval(timer);
    const onVisibilityChange = () => (document.hidden ? stop() : start());

    lastFetchRef.current = 0;
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parkId]);

  const openRides  = rides.filter(r => r.is_open && r.wait_time > 0);
  const closedRides = rides.filter(r => !r.is_open || r.wait_time === 0);
  const topRides   = [...openRides].sort((a, b) => b.wait_time - a.wait_time).slice(0, 4);

  return { rides, openRides, closedRides, topRides, loading, error, lastUpdated, refetch: fetchData };
}
