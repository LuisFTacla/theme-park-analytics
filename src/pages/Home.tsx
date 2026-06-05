// src/pages/Home.tsx

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { Spinner, ErrorMessage } from '@/components/ui';
import { useState } from 'react';
import type { Park } from '@/types';

export function Home() {
  const navigate = useNavigate();
  const { data: parks, loading, error } = useQuery(() => api.getParks());
  const [search, setSearch] = useState('');
  const [hoverId, setHoverId] = useState<number | null>(null);

  const filtered = (parks ?? []).filter(p =>
    p.park_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (park: Park) => {
    navigate(`/park/${park.park_id}`, { state: { parkName: park.park_name } });
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white font-body">
      {/* Background grid effect */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(239,35,60,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(239,35,60,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-20 pb-16">

        {/* Header */}
        <div className="mb-14 animate-fade-up" style={{ animationDelay: '0s', opacity: 0 }}>
          <p className="font-display text-xs tracking-[0.3em] text-brand-red uppercase mb-4">
            Theme Park Analytics
          </p>
          <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight mb-4">
            Inteligência<br />
            <span className="text-brand-red">de Filas</span>
          </h1>
          <p className="text-brand-muted text-lg max-w-md leading-relaxed">
            Histórico real de tempos de espera, calendários de lotação e status ao vivo
            de parques temáticos ao redor do mundo.
          </p>
        </div>

        {/* Search + lista */}
        <div className="animate-fade-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
          <input
            type="text"
            placeholder="Buscar parque..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="
              w-full mb-4 px-4 py-3 rounded-xl bg-brand-card border border-brand-border
              text-white placeholder-brand-muted font-body text-sm
              focus:outline-none focus:border-brand-red/60 focus:ring-1 focus:ring-brand-red/30
              transition-all
            "
          />

          {loading && (
            <div className="flex justify-center py-12">
              <Spinner size={28} />
            </div>
          )}
          {error && <ErrorMessage message={error} />}

          {!loading && filtered.length > 0 && (
            <ul className="space-y-1.5">
              {filtered.map(park => (
                <li key={park.park_id}>
                  <button
                    onClick={() => handleSelect(park)}
                    onMouseEnter={() => setHoverId(park.park_id)}
                    onMouseLeave={() => setHoverId(null)}
                    className={`
                      w-full text-left px-5 py-4 rounded-xl border transition-all
                      flex items-center justify-between group
                      ${hoverId === park.park_id
                        ? 'bg-brand-card border-brand-red/40 text-white'
                        : 'bg-brand-card/50 border-brand-border text-white/80 hover:border-brand-border'}
                    `}
                  >
                    <span className="font-body text-sm">{park.park_name}</span>
                    <span
                      className={`font-display text-xs tracking-widest transition-all ${
                        hoverId === park.park_id ? 'text-brand-red opacity-100' : 'opacity-0'
                      }`}
                    >
                      VER →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!loading && !error && filtered.length === 0 && parks && (
            <p className="text-brand-muted text-sm text-center py-8">
              Nenhum parque encontrado para "{search}".
            </p>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-brand-border animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-brand-muted text-xs font-mono">
            <div>
              <p className="text-white/60 mb-1">Luis Fernando Melnek Tacla</p>
              <div className="flex gap-4">
                <a href="https://www.linkedin.com/in/luis-fernando-melnek-tacla/" target="_blank" rel="noreferrer"
                  className="hover:text-brand-red transition-colors">LinkedIn</a>
                <a href="https://github.com/LuisFTacla" target="_blank" rel="noreferrer"
                  className="hover:text-brand-red transition-colors">GitHub</a>
              </div>
            </div>
            <div className="text-right">
              <p>Powered by Queue-Times.com</p>
              <p>Google BigQuery · AWS Lambda · Vercel</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
