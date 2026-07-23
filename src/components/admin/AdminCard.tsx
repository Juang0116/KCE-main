import React from 'react';
import { cn } from '@/utils/format';

interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
  hoverEffect?: boolean;
}

export function AdminCard({
  children,
  className,
  noPadding = false,
  hoverEffect = false,
  ...props
}: AdminCardProps) {
  return (
    <div
      className={cn(
        // Fondo orgánico y translúcido
        'bg-[color:var(--color-surface)]/90 backdrop-blur-[var(--backdrop-blur)]',
        // Borde elegante y sutil de tu branding
        'border border-[color:var(--color-border)]',
        // Sombra suave que le da profundidad sin ensuciar
        'shadow-soft',
        // Redondeo moderno alineado a tu marca
        'rounded-[var(--radius-lg)]',
        // Transición fluida para micro-interacciones
        'transition-all duration-[var(--dur-2)] ease-out',
        // Efecto hover sutil (opcional para tarjetas interactivas)
        hoverEffect && 'hover:-translate-y-1 hover:border-[var(--ring-inner)] hover:shadow-pop',
        // Respiro visual (espacio en blanco fundamental para la elegancia)
        !noPadding && 'p-6 lg:p-8',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AdminCardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminCardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        'font-heading text-xl font-semibold tracking-tight text-[color:var(--color-text)]',
        className,
      )}
    >
      {children}
    </h3>
  );
}

export function AdminCardSubtitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn('mt-1 font-body text-sm text-[color:var(--color-text-muted)]', className)}>
      {children}
    </p>
  );
}
