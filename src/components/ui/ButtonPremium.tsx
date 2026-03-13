'use client';

import * as React from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'ghost';
type Size = 'sm' | 'md';

export function ButtonPremium({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-medium transition',
        'focus-visible:ring-[color:var(--brand)]/35 focus-visible:outline-none focus-visible:ring-2',
        size === 'sm' ? 'h-9 px-4 text-sm' : 'h-11 px-5 text-sm',
        variant === 'primary' && [
          'bg-[color:var(--brand)] text-white',
          'hover:brightness-110',
          'shadow-[0_10px_30px_rgba(31,102,255,.25)]',
        ],
        variant === 'ghost' && [
          'bg-transparent text-[color:var(--text)]',
          'border border-[color:var(--border)]',
          'hover:bg-black/5 dark:hover:bg-white/5',
        ],
        className,
      )}
    />
  );
}
