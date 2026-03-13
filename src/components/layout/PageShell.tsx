// src/components/layout/PageShell.tsx
import clsx from 'clsx';
import * as React from 'react';

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={clsx('mx-auto w-full max-w-5xl px-4 py-10 md:py-16', className)}>
      {children}
    </main>
  );
}
