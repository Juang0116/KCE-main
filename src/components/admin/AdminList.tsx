import React from 'react';
import { cn } from '@/utils/format';

interface AdminListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function AdminList({ children, className, ...props }: AdminListProps) {
  return (
    <div className={cn("flex flex-col w-full", className)} {...props}>
      {children}
    </div>
  );
}

interface AdminListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean; // Si es true, añade efecto hover para hacer click
}

export function AdminListItem({ children, interactive = false, className, ...props }: AdminListItemProps) {
  return (
    <div 
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 lg:py-5",
        // Borde inferior sutil, excepto en el último elemento
        "border-b border-[color:var(--color-border)] last:border-b-0",
        // Efecto hover premium si es interactivo
        interactive && "cursor-pointer transition-colors duration-[var(--dur-2)] hover:bg-[color:var(--color-surface-2)]/50 -mx-4 px-4 rounded-xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Pequeños componentes de ayuda para estructurar el contenido de cada fila
export function ListCol({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={cn("flex flex-col gap-0.5", className)}>{children}</div>;
}

export function ListTitle({ children, className }: { children: React.ReactNode, className?: string }) {
  return <span className={cn("text-sm font-semibold text-[color:var(--color-text)]", className)}>{children}</span>;
}

export function ListSubtitle({ children, className }: { children: React.ReactNode, className?: string }) {
  return <span className={cn("text-xs font-body text-[color:var(--color-text-muted)]", className)}>{children}</span>;
}