import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Home as HomeIcon, Menu, X } from 'lucide-react';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/services/api';
import { ParkSearchList } from '@/components/ParkSearchList';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Park } from '@/types';

interface Props {
  currentParkId: number;
  onSelectPark: (park: Park) => void;
}

/** Botão "hambúrguer" + painel lateral com navegação entre parques. */
export function ParkMenu({ currentParkId, onSelectPark }: Props) {
  const [open, setOpen] = useState(false);
  // Só busca a lista quando o menu é aberto pela primeira vez
  const [requested, setRequested] = useState(false);
  const { data: parks, loading, error } = useQuery(() => api.getParks(), [], { enabled: requested });

  const openMenu = () => {
    setRequested(true);
    setOpen(true);
  };
  const closeMenu = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    // Trava o scroll da página por trás do painel
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        aria-label="Abrir menu de parques"
        aria-expanded={open}
        className="flex items-center gap-2 p-2 md:px-3 rounded-lg border border-brand-border bg-brand-card text-brand-muted hover:text-brand-text hover:border-brand-muted transition-all"
      >
        <Menu size={16} />
        <span className="hidden md:inline font-display text-xs tracking-widest uppercase">Parques</span>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[9998] flex justify-end" role="dialog" aria-modal="true" aria-label="Menu de parques">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeMenu} />

          <aside className="relative flex flex-col w-full max-w-sm h-full bg-brand-card border-l border-brand-border shadow-2xl shadow-black/60 animate-slide-in-right motion-reduce:animate-none">
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
              <span className="font-display font-bold text-lg">
                Parko<span className="text-brand-primary">metrics</span>
              </span>
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Fechar menu"
                className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-border transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <Link
              to="/"
              onClick={closeMenu}
              className="flex items-center gap-3 px-5 py-3 text-sm font-body text-brand-text/80 hover:text-brand-text hover:bg-brand-primary/10 border-b border-brand-border transition-all"
            >
              <HomeIcon size={16} className="text-brand-muted" />
              Início
            </Link>

            <p className="px-5 pt-4 pb-2 font-display text-[10px] tracking-widest uppercase text-brand-muted">
              Trocar de parque
            </p>
            <div className="flex flex-col min-h-0 flex-1">
              <ParkSearchList
                parks={parks ?? []}
                loading={loading || (requested && !parks && !error)}
                error={error}
                currentParkId={currentParkId}
                onSelect={park => {
                  closeMenu();
                  onSelectPark(park);
                }}
                listClassName="flex-1"
              />
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-t border-brand-border">
              <span className="text-sm font-body text-brand-muted">Tema</span>
              <ThemeToggle />
            </div>
          </aside>
        </div>,
        document.body
      )}
    </>
  );
}
