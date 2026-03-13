import * as React from 'react';
import clsx from 'clsx';

type TProps = { className?: string; children: React.ReactNode };

export function H1({ className, children }: TProps) {
  return (
    <h1
      className={clsx(
        'font-heading text-3xl tracking-tight text-[color:var(--text)] md:text-5xl',
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function H2({ className, children }: TProps) {
  return (
    <h2
      className={clsx(
        'font-heading text-xl tracking-tight text-[color:var(--text)] md:text-2xl',
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function H3({ className, children }: TProps) {
  return (
    <h3
      className={clsx(
        'font-heading text-lg tracking-tight text-[color:var(--text)] md:text-xl',
        className,
      )}
    >
      {children}
    </h3>
  );
}

export function P({ className, children }: TProps) {
  return (
    <p className={clsx('text-sm leading-relaxed text-[color:var(--muted)] md:text-base', className)}>
      {children}
    </p>
  );
}

export function Lead({ className, children }: TProps) {
  return (
    <p className={clsx('text-base leading-relaxed text-[color:var(--muted)] md:text-lg', className)}>
      {children}
    </p>
  );
}

export function Eyebrow({ className, children }: TProps) {
  return (
    <div className={clsx('text-xs uppercase tracking-widest text-[color:var(--muted)]', className)}>
      {children}
    </div>
  );
}
