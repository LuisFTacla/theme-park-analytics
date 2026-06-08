import { useState, useEffect, useRef } from 'react';
import { api } from '@/services/api';
import type { LiveRide } from '@/types';

const POLL_INTERVAL = 60_000; // 60 segundos

export function useLiveData(parkId: number | null) {
  const [rides, setRides] = useState<LiveRide[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = async () => {
    if (!parkId) return;
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

  useEffect(() => {
    if (!parkId) return;
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parkId]);

  const openRides  = rides.filter(r => r.is_open && r.wait_time > 0);
  const closedRides = rides.filter(r => !r.is_open || r.wait_time === 0);
  const topRides   = [...openRides].sort((a, b) => b.wait_time - a.wait_time).slice(0, 4);

  return { rides, openRides, closedRides, topRides, loading, error, lastUpdated, refetch: fetchData };
}
