import clsx from 'clsx';
import * as React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: BadgeVariant;
  dot?: boolean; // Añade un micro-indicador de estado
}

const variants: Record<BadgeVariant, string> = {
  default: 'border-brand-dark/10 bg-brand-dark/5 text-muted',
  brand: 'border-brand-blue/20 bg-brand-blue/5 text-brand-blue',
  success: 'border-emerald-500/20 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-500/20 bg-amber-50 text-amber-700',
  error: 'border-rose-500/20 bg-rose-50 text-rose-700',
  info: 'border-sky-500/20 bg-sky-50 text-sky-700',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-muted/40',
  brand: 'bg-brand-blue',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-rose-500',
  info: 'bg-sky-500',
};

export function Badge({ 
  children, 
  className, 
  variant = 'default',
  dot = false 
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        variants[variant],
        className
      )}
    >
      {dot && (
        <span 
          className={clsx('h-1.5 w-1.5 rounded-full animate-pulse', dotColors[variant])} 
          aria-hidden="true" 
        />
      )}
      {children}
    </span>
  );
}