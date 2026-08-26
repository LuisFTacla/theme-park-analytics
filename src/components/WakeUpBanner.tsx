import { useServerWaking } from '@/hooks/useServerWaking';
import { Spinner } from '@/components/ui';

export function WakeUpBanner() {
  const waking = useServerWaking();

  if (!waking) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[9999] flex justify-center px-4 pt-4 pointer-events-none animate-fade-up">
      <div
        className="
          pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl
          bg-brand-card border border-brand-red/30 shadow-2xl shadow-black/60
          text-sm font-body text-white/90
        "
      >
        <Spinner size={16} />
        <span>
          Aguarde, por favor!
          <span className="text-brand-muted"> — Estou buscando os dados.</span>
        </span>
      </div>
    </div>
  );
}
