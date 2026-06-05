// src/components/ui/index.tsx

import { clsx } from 'clsx';
import { ReactNode } from 'react';

// ─── SKELETON ────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'rounded-md bg-gradient-to-r from-brand-card via-brand-border to-brand-card bg-[length:200%_100%] animate-shimmer',
        className
      )}
    />
  );
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'bg-brand-card border border-brand-border rounded-2xl p-5',
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'green' | 'red' | 'yellow' | 'muted';

export function Badge({
  children,
  variant = 'muted',
}: {
  children: ReactNode;
  variant?: BadgeVariant;
}) {
  const styles: Record<BadgeVariant, string> = {
    green:  'bg-green-500/20 text-green-400 border-green-500/30',
    red:    'bg-red-500/20 text-red-400 border-red-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    muted:  'bg-brand-border text-brand-muted border-transparent',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono border',
        styles[variant]
      )}
    >
      {children}
    </span>
  );
}

// ─── SPINNER ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin text-brand-red"
    >
      <circle
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.416"
        strokeDashoffset="10"
        opacity="0.3"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── ERROR MESSAGE ────────────────────────────────────────────────────────────
export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-body">
      <span className="text-lg">⚠</span>
      {message}
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-brand-muted">
      <span className="text-4xl opacity-40">🎢</span>
      <p className="font-body text-sm">{message}</p>
    </div>
  );
}
