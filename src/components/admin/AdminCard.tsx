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
        "bg-[color:var(--color-surface)]/90 backdrop-blur-[var(--backdrop-blur)]",
        // Borde elegante y sutil de tu branding
        "border border-[color:var(--color-border)]",
        // Sombra suave que le da profundidad sin ensuciar
        "shadow-soft",
        // Redondeo moderno alineado a tu marca
        "rounded-[var(--radius-lg)]",
        // Transición fluida para micro-interacciones
        "transition-all duration-[var(--dur-2)] ease-out",
        // Efecto hover sutil (opcional para tarjetas interactivas)
        hoverEffect && "hover:shadow-pop hover:-translate-y-1 hover:border-[var(--ring-inner)]",
        // Respiro visual (espacio en blanco fundamental para la elegancia)
        !noPadding && "p-6 lg:p-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AdminCardHeader({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4", className)}>
      {children}
    </div>
  );
}

export function AdminCardTitle({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <h3 className={cn("text-xl font-heading font-semibold text-[color:var(--color-text)] tracking-tight", className)}>
      {children}
    </h3>
  );
}

export function AdminCardSubtitle({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <p className={cn("text-sm font-body text-[color:var(--color-text-muted)] mt-1", className)}>
      {children}
    </p>
  );
}