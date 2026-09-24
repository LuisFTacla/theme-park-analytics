import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, CircleMarker, Marker, Tooltip } from 'react-leaflet';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { Skeleton, ErrorMessage, EmptyState } from '@/components/ui';
import { waitTimeColor, waitTimeRadius, minutesFromTimeLabel } from '@/utils';
import { getRideCoordinate, PARK_CENTER } from '@/config/rideCoordinates';
import { SHOW_VENUES, PORTAL_DA_ESCURIDAO } from '@/config/showVenues';
import { Play, Pause } from 'lucide-react';
import type { HeatmapInterval } from '@/types';

interface Props {
  parkId: number;
  date: string;
  interval: HeatmapInterval;
}

const BASE_PLAYBACK_MS = 1200;
const SPEEDS = [1, 2, 4, 8] as const;

// Janela de destaque antes/depois de uma sessão de show ("prestes a
// começar" / "saída do público"), em minutos.
const SHOW_HALO_MINUTES = 30;

type ShowPhase = 'upcoming' | 'ongoing' | 'dispersing' | 'open' | 'closed';

const PHASE_LABEL: Record<ShowPhase, string> = {
  upcoming: 'Prestes a começar',
  ongoing: 'Em exibição',
  dispersing: 'Saída do público',
  open: 'Aberto',
  closed: 'Fechado',
};

function buildShowIcon(icon: string, color: string | undefined, phase: ShowPhase) {
  const ringColor = color ?? '#94a3b8';
  const active = phase === 'ongoing' || phase === 'open';
  const upcoming = phase === 'upcoming';
  const faded = phase === 'dispersing' || phase === 'closed';

  // Fundo sempre escuro e sólido (mesma cor do card do app) -- contra a foto
  // de satélite, um fundo semitransparente sumia de vista. A cor do show fica
  // só na borda/brilho, que já diferencia os 3 estados.
  const border = upcoming ? `border: 2.5px dashed ${ringColor};` : `border: 2.5px solid ${ringColor};`;
  const glow = active
    ? `box-shadow: 0 0 14px 2px ${ringColor}, 0 2px 6px rgba(0,0,0,0.7);`
    : `box-shadow: 0 2px 6px rgba(0,0,0,0.7);`;
  const opacity = faded ? 0.8 : 1;

  const html = `<div style="width:36px;height:36px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:18px;background:#0a0a0fe6;${border}${glow}opacity:${opacity};">${icon}</div>`;

  return L.divIcon({ html, className: '', iconSize: [36, 36], iconAnchor: [18, 18] });
}

export function ParkMapAnimation({ parkId, date, interval }: Props) {
  const { data, loading, error } = useQuery(
    () => api.getHeatmap(parkId, date, interval),
    [parkId, date, interval]
  );

  // Sem show pra esse parque/dia, `shows` fica vazio e nenhum marcador extra
  // é desenhado -- não precisa de tratamento especial pros demais parques.
  const { data: shows } = useQuery(() => api.getShows(parkId, date), [parkId, date]);

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

  const currentTime = times[index] ?? '';

  // Marcadores de show pro instante selecionado no scrubber (não a hora real
  // do relógio) -- assim eles aparecem/somem junto com a animação do dia.
  const showMarkers = useMemo(() => {
    if (!shows?.length || !currentTime) return [];
    const nowMin = minutesFromTimeLabel(currentTime);

    const sessionsByName = new Map<string, { inicio: number; fim: number }[]>();
    for (const s of shows) {
      const list = sessionsByName.get(s.nome) ?? [];
      list.push({ inicio: minutesFromTimeLabel(s.periodo_de), fim: minutesFromTimeLabel(s.periodo_ate) });
      sessionsByName.set(s.nome, list);
    }

    const markers: { nome: string; phase: ShowPhase }[] = [];

    for (const [nome, sessions] of sessionsByName) {
      // Portal da Escuridão não é um show com sessões -- é um labirinto que
      // fica simplesmente aberto ou fechado durante a janela informada.
      if (nome === PORTAL_DA_ESCURIDAO) {
        const isOpen = sessions.some(s => nowMin >= s.inicio && nowMin < s.fim);
        markers.push({ nome, phase: isOpen ? 'open' : 'closed' });
        continue;
      }

      const venue = SHOW_VENUES[nome];
      if (!venue) continue;

      for (const s of sessions) {
        // No Ritmo de Trolls: público já se desloca bem antes da janela
        // padrão de 30min -- ver `highlightFromHour` em showVenues.ts.
        const preStart = venue.highlightFromHour != null ? venue.highlightFromHour * 60 : s.inicio - SHOW_HALO_MINUTES;
        if (nowMin >= preStart && nowMin < s.inicio) { markers.push({ nome, phase: 'upcoming' }); break; }
        if (nowMin >= s.inicio && nowMin < s.fim) { markers.push({ nome, phase: 'ongoing' }); break; }
        if (nowMin >= s.fim && nowMin < s.fim + SHOW_HALO_MINUTES) { markers.push({ nome, phase: 'dispersing' }); break; }
      }
    }

    return markers;
  }, [shows, currentTime]);

  if (loading) return <Skeleton className="h-[480px] w-full rounded-xl" />;
  if (error) return <ErrorMessage message={error} />;
  if (!times.length) return <EmptyState message="Sem dados de atrações para este dia." />;

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

          {showMarkers.map(({ nome, phase }) => {
            const venue = SHOW_VENUES[nome];
            if (!venue) return null;

            return (
              <Marker
                key={nome}
                position={[venue.coord.lat, venue.coord.lng]}
                icon={buildShowIcon(venue.icon, venue.color, phase)}
              >
                <Tooltip direction="top" offset={[0, -18]}>
                  <span className="font-body text-xs">
                    <strong>{nome}</strong>
                    <br />
                    {PHASE_LABEL[phase]}
                  </span>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
