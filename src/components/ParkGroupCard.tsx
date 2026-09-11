import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { Skeleton, ErrorMessage } from '@/components/ui';
import { minutesFromTimeLabel, waitTimeColor } from '@/utils';
import { todayForPark } from '@/config/timezone';
import { computeTrend, type TrendPoint } from '@/utils/trend';
import { trimToOperatingHours, toOperatingMinutes } from '@/utils/operatingHours';
import { Sparkline } from '@/components/Sparkline';
import { TrendIndicator } from '@/components/TrendIndicator';
import type { ParkGroup } from '@/config/parkGroups';
import type { Park } from '@/types';
import { clsx } from 'clsx';

interface Props {
  group: ParkGroup;
  parks: Park[]; // lista completa de parques, pra resolver o nome de cada membro do grupo
  primary?: boolean;
}

// Bloco usado pra combinar as leituras (não sincronizadas) dos parques de um grupo.
const GROUP_BLOCK_MINUTES = 15;

export function ParkGroupCard({ group, parks, primary = false }: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  // Grupos são montados com parques do mesmo fuso — usar o primeiro representa o grupo inteiro.
  const today = todayForPark(group.parkIds[0]);

  const { data: seriesPerPark, loading, error } = useQuery(
    () => Promise.all(group.parkIds.map((id) => api.getEvolution(id, today))),
    [group.id, today]
  );

  const profile = useMemo<TrendPoint[]>(() => {
    if (!seriesPerPark?.length) return [];
    // Cada parque coleta em seus próprios instantes (não sincronizados entre si),
    // então agrupamos por bloco de tempo — não por "horario" exato — pra garantir
    // que a média realmente combine os parques do grupo, em vez de só concatenar
    // leituras que raramente caem no mesmo minuto.
    const byBlock = new Map<number, number[]>();
    for (const series of seriesPerPark) {
      for (const p of series) {
        const block = Math.floor(toOperatingMinutes(minutesFromTimeLabel(p.horario)) / GROUP_BLOCK_MINUTES) * GROUP_BLOCK_MINUTES;
        const arr = byBlock.get(block) ?? [];
        arr.push(p.wait_time);
        byBlock.set(block, arr);
      }
    }
    const merged = [...byBlock.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([minutesFromMidnight, vals]) => ({
        minutesFromMidnight,
        waitTime: vals.reduce((a, b) => a + b, 0) / vals.length,
      }));

    // Corta a cauda da madrugada (ex: Extra Magic Hours da noite anterior) e
    // apara zeros nas pontas — ver utils/operatingHours.ts
    return trimToOperatingHours(merged, p => p.waitTime);
  }, [seriesPerPark]);

  const current = profile.length ? profile[profile.length - 1].waitTime : null;

  // Fila atual de cada parque do grupo individualmente, pra mostrar na lista expandida.
  const currentByPark = useMemo(() => {
    const map = new Map<number, number | null>();
    if (!seriesPerPark) return map;
    group.parkIds.forEach((id, i) => {
      const trimmed = trimToOperatingHours(seriesPerPark[i] ?? [], p => p.wait_time);
      map.set(id, trimmed.length ? trimmed[trimmed.length - 1].wait_time : null);
    });
    return map;
  }, [seriesPerPark, group.parkIds]);

  const trend = useMemo(() => {
    const points = profile.filter((p) => p.waitTime > 0);
    return points.length >= 2 ? computeTrend(points) : null;
  }, [profile]);

  function handleClick() {
    if (group.parkIds.length === 1) {
      goToPark(group.parkIds[0]);
    } else {
      setExpanded((e) => !e);
    }
  }

  function goToPark(parkId: number) {
    const parkName = parks.find((p) => p.park_id === parkId)?.park_name ?? group.label;
    navigate(`/park/${parkId}`, { state: { parkName } });
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      className={clsx(
        'bg-brand-card border rounded-2xl p-4 cursor-pointer transition-all',
        'hover:border-brand-muted/40 hover:scale-[1.01] hover:shadow-md',
        primary ? 'border-brand-red/40 bg-brand-red/5' : 'border-brand-border'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-display text-sm font-medium text-white leading-snug line-clamp-2 min-h-[2.25rem]">
          {group.label}
        </span>
        {trend && <span className="shrink-0 mt-0.5"><TrendIndicator trend={trend} /></span>}
      </div>

      {loading ? (
        <Skeleton className="h-16 w-full" />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          <div className="flex items-baseline justify-between mb-2">
            <span className="font-mono text-2xl font-bold text-white">
              {current != null ? Math.round(current) : '—'}
              <span className="text-xs font-body text-zinc-400 font-normal ml-1">min</span>
            </span>
            {current != null && (
              <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: waitTimeColor(current) }} />
            )}
          </div>

          {profile.length >= 2 && (
            <div className="h-8 -mx-1">
              <Sparkline points={profile} />
            </div>
          )}
        </>
      )}

      {expanded && group.parkIds.length > 1 && (
        <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-brand-border/40">
          {group.parkIds.map((id) => {
            const name = parks.find((p) => p.park_id === id)?.park_name ?? `#${id}`;
            const parkCurrent = currentByPark.get(id) ?? null;
            return (
              <button
                key={id}
                onClick={(e) => {
                  e.stopPropagation();
                  goToPark(id);
                }}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-body bg-brand-dark border border-brand-border text-brand-muted hover:text-white hover:border-brand-muted transition-all"
              >
                <span className="truncate">{name}</span>
                <span className="flex items-center gap-1.5 shrink-0 font-mono text-white">
                  {parkCurrent != null ? `${Math.round(parkCurrent)} min` : '—'}
                  {parkCurrent != null && (
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: waitTimeColor(parkCurrent) }} />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
