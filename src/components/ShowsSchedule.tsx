import { useMemo } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { Skeleton } from '@/components/ui';
import { formatDateBR } from '@/utils';
import { PORTAL_DA_ESCURIDAO } from '@/config/showVenues';

interface Props {
  parkId: number;
  date: string;
}

/** "12:00:00" -> "12:00" */
function formatShowTime(t: string): string {
  return t.slice(0, 5);
}

export function ShowsSchedule({ parkId, date }: Props) {
  const { data: shows, loading } = useQuery(
    () => api.getShows(parkId, date),
    [parkId, date]
  );

  // Uma linha por show (não por sessão), ordenada pelo horário da primeira
  // sessão do dia. Portal da Escuridão é um labirinto de terror, não um show
  // com sessões -- fica de fora dessa lista (ver 5d no mapa pro destaque dele).
  const grouped = useMemo(() => {
    if (!shows) return [];
    const byName = new Map<string, typeof shows>();
    for (const s of shows) {
      if (s.nome === PORTAL_DA_ESCURIDAO) continue;
      const list = byName.get(s.nome) ?? [];
      list.push(s);
      byName.set(s.nome, list);
    }
    return [...byName.entries()]
      .map(([nome, sessions]) => ({
        nome,
        sessions: [...sessions].sort((a, b) => a.periodo_de.localeCompare(b.periodo_de)),
      }))
      .sort((a, b) => a.sessions[0].periodo_de.localeCompare(b.sessions[0].periodo_de));
  }, [shows]);

  // Sem dado (ou erro) pra esse dia/parque -- shows são um complemento, não
  // vale poluir a tela com aviso de erro por causa disso.
  if (loading) return <Skeleton className="h-20 w-full rounded-2xl" />;
  if (!grouped.length) return null;

  return (
    <section className="animate-fade-up" style={{ opacity: 0 }}>
      <h2 className="font-display text-sm tracking-widest text-brand-muted uppercase mb-4">
        🎭 Horários de Shows — {formatDateBR(date)}
      </h2>
      <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-2">
        {grouped.map(g => (
          <div
            key={g.nome}
            className="flex items-center gap-3 flex-wrap bg-brand-dark/40 border border-brand-border rounded-xl px-4 py-2.5"
          >
            <span className="font-body text-sm text-white font-medium min-w-[180px]">
              {g.nome}
            </span>
            <div className="flex gap-2 flex-wrap">
              {g.sessions.map((s, i) => (
                <span
                  key={i}
                  className="font-mono text-xs text-brand-red bg-brand-red/10 px-2 py-1 rounded-md whitespace-nowrap"
                >
                  {formatShowTime(s.periodo_de)}–{formatShowTime(s.periodo_ate)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
