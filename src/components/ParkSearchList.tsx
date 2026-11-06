import { useState } from 'react';
import { clsx } from 'clsx';
import { Spinner, ErrorMessage } from '@/components/ui';
import type { Park } from '@/types';

interface Props {
  parks: Park[];
  loading: boolean;
  error: string | null;
  onSelect: (park: Park) => void;
  /** parque aberto no momento — fica destacado na lista */
  currentParkId?: number;
  listClassName?: string;
}

/** Campo de busca + lista de parques. Usado no dropdown da Home e no menu do Dashboard. */
export function ParkSearchList({ parks, loading, error, onSelect, currentParkId, listClassName }: Props) {
  const [search, setSearch] = useState('');

  const filtered = parks.filter(p =>
    p.park_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="p-2 border-b border-brand-border">
        <input
          autoFocus
          type="text"
          placeholder="Buscar parque..."
          aria-label="Buscar parque"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="
            w-full px-3 py-2 rounded-lg bg-brand-bg border border-brand-border
            text-brand-text placeholder-brand-muted font-body text-sm
            focus:outline-none focus:border-brand-primary/60
            transition-all
          "
        />
      </div>

      <ul className={clsx('overflow-y-auto', listClassName)}>
        {loading && (
          <li className="flex justify-center py-6"><Spinner size={20} /></li>
        )}
        {error && (
          <li className="px-4 py-3"><ErrorMessage message={error} /></li>
        )}
        {!loading && !error && filtered.length === 0 && (
          <li className="px-4 py-6 text-center text-brand-muted text-sm">
            Nenhum parque encontrado para "{search}".
          </li>
        )}
        {!loading && filtered.map(park => {
          const isCurrent = park.park_id === currentParkId;
          return (
            <li key={park.park_id}>
              <button
                onClick={() => onSelect(park)}
                aria-current={isCurrent ? 'page' : undefined}
                className={clsx(
                  'w-full text-left px-5 py-3 text-sm font-body transition-all flex items-center justify-between group',
                  isCurrent
                    ? 'text-brand-primary bg-brand-primary/10'
                    : 'text-brand-text/80 hover:text-brand-text hover:bg-brand-primary/10'
                )}
              >
                <span>{park.park_name}</span>
                <span className="text-brand-primary text-xs opacity-0 group-hover:opacity-100 transition-opacity font-display tracking-widest">
                  {isCurrent ? 'ATUAL' : 'VER →'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
