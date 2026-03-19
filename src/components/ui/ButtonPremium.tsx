'use client';

import * as React from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'ghost';
type Size = 'sm' | 'md';

interface ButtonPremiumProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/**
 * Versión de alta gama para CTAs principales.
 * Utiliza sombras suavizadas y transiciones de brillo para un look "Apple-esque".
 */
export function ButtonPremium({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonPremiumProps) {
  return (
    <button
      {...props}
      className={clsx(
        // Base
        'inline-flex items-center justify-center rounded-full font-bold transition-all duration-300',
        'active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        
        // Focus state refinado
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30',
        
        // Dimensiones
        size === 'sm' ? 'h-9 px-6 text-xs tracking-wide' : 'h-12 px-8 text-sm tracking-tight',
        
        // Variantes con lógica de diseño KCE
        variant === 'primary' && [
          'bg-brand-blue text-white',
          'hover:brightness-110 hover:shadow-pop',
          'shadow-[0_12px_40px_-12px_rgba(31,102,255,0.45)]', // Sombra atmosférica
        ],
        
        variant === 'ghost' && [
          'bg-transparent text-brand-blue',
          'border border-brand-dark/10',
          'hover:bg-brand-dark/5 hover:border-brand-dark/20',
        ],
        
        className
      )}
    />
  );
}