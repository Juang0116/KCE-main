// src/components/layout/Container.tsx
import * as React from 'react';
import clsx from 'clsx';

export interface ContainerProps {
  children: React.ReactNode;
  // Añadimos undefined explícitamente para cumplir con la regla estricta
  className?: string | undefined; 
  clean?: boolean;
}

export function Container({
  className,
  children,
  clean = false,
}: ContainerProps) {
  return (
    <div
      className={clsx(
        'mx-auto w-full',
        !clean && 'px-4 md:px-8',
        className // clsx ya maneja undefined internamente sin problemas
      )}
      style={{ maxWidth: 'var(--container, 1280px)' }}
    >
      {children}
    </div>
  );
}