import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { Skeleton, ErrorMessage, EmptyState } from '@/components/ui';
import { waitTimeColor, waitTimeRadius } from '@/utils';
import { getRideCoordinate, PARK_CENTER } from '@/config/rideCoordinates';
import { Play, Pause } from 'lucide-react';
import type { HeatmapInterval } from '@/types';

interface Props {
  parkId: number;
  date: string;
  interval: HeatmapInterval;
}

const BASE_PLAYBACK_MS = 1200;
const SPEEDS = [1, 2, 4, 8] as const;

export function ParkMapAnimation({ parkId, date, interval }: Props) {
  const { data, loading, error } = useQuery(
    () => api.getHeatmap(parkId, date, interval),
    [parkId, date, interval]
  );

  const { times, byTime } = useMemo(() => {
    if (!data?.length) return { times: [] as string[], byTime: {} as Record<string, typeof data> };

    const timeSet = new Set<string>();
    const grouped: Record<string, typeof data> = {};
    for (const point of data) {
      timeSet.add(point.label_tempo);
      (grouped[point.label_tempo] ??= []).push(point);
    }
    return { times: [...timeSet].sort(), byTime: grouped };
  }, [data]);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<typeof SPEEDS[number]>(1);

  // Reseta a posição sempre que a data/intervalo muda (novo conjunto de horários)
  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [date, interval]);

  useEffect(() => {
    if (!playing || times.length === 0) return;
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % times.length);
    }, BASE_PLAYBACK_MS / speed);
    return () => clearInterval(timer);
  }, [playing, speed, times.length]);

  if (loading) return <Skeleton className="h-[480px] w-full rounded-xl" />;
  if (error) return <ErrorMessage message={error} />;
  if (!times.length) return <EmptyState message="Sem dados de atrações para este dia." />;

  const currentTime = times[index];
  const currentPoints = byTime[currentTime] ?? [];
  const transitionMs = Math.min(400, Math.max(120, (BASE_PLAYBACK_MS / speed) * 0.7));

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setPlaying(p => !p)}
          className="
            flex items-center justify-center w-10 h-10 rounded-full
            bg-brand-red text-white shrink-0
            hover:opacity-90 transition-opacity
          "
          aria-label={playing ? 'Pausar' : 'Reproduzir'}
        >
          {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>

        <input
          type="range"
          min={0}
          max={times.length - 1}
          value={index}
          onChange={e => {
            setPlaying(false);
            setIndex(Number(e.target.value));
          }}
          className="flex-1 accent-brand-red"
        />

        <span className="font-mono text-sm text-white w-14 text-right shrink-0">
          {currentTime}
        </span>
      </div>

      {/* Velocidade */}
      <div className="flex items-center gap-2">
        <span className="font-body text-xs text-brand-muted uppercase tracking-wider">Velocidade:</span>
        <div className="flex gap-1">
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
                speed === s
                  ? 'bg-brand-red border-brand-red text-white'
                  : 'bg-brand-card border-brand-border text-brand-muted hover:text-white hover:border-brand-muted'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Mapa */}
      <div
        className="park-map rounded-xl overflow-hidden border border-brand-border"
        style={{ ['--park-map-transition' as string]: `${transitionMs}ms` }}
      >
        <MapContainer
          center={[PARK_CENTER.lat, PARK_CENTER.lng]}
          zoom={17}
          maxZoom={19}
          scrollWheelZoom={false}
          style={{ height: 480, width: '100%', background: '#0a0a0f' }}
        >
          <TileLayer
            attribution="Tiles &copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />

          {currentPoints.map(point => {
            const coord = getRideCoordinate(point.name, date);
            if (!coord) return null;

            const wait = point.wait_time_medio;
            const isClosed = wait <= 0;

            return (
              <CircleMarker
                key={point.name}
                center={[coord.lat, coord.lng]}
                radius={waitTimeRadius(wait)}
                pathOptions={{
                  color: '#ffffff',
                  weight: 1,
                  fillColor: isClosed ? '#4a4a6a' : waitTimeColor(wait),
                  fillOpacity: isClosed ? 0.3 : 0.75,
                }}
              >
                <Tooltip direction="top" offset={[0, -4]}>
                  <span className="font-body text-xs">
                    <strong>{point.name}</strong>
                    <br />
                    {isClosed ? 'Fechada' : `${Math.round(wait)} min`}
                  </span>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
