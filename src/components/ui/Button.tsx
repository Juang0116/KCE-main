'use client';

import * as React from 'react';
import Link, { type LinkProps } from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

// --- Utility: Slot & Ref Composition ---
function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    });
  };
}

// Corregimos el tipo de Slot para que acepte cualquier ReactNode como hijo, 
// pero valide que sea un elemento válido al clonar.
interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, ref) => {
    if (!React.isValidElement(children)) return null;
    
    return React.cloneElement(children as React.ReactElement<any>, {
      ...props,
      ...children.props,
      className: clsx(props.className, children.props.className),
      ref: composeRefs(ref, (children as any).ref),
    });
  }
);
Slot.displayName = 'Slot';

// --- Variants Definition ---
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-xl font-heading font-bold transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20',
    'disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: 'bg-brand-blue text-white shadow-soft hover:bg-brand-blue/90 hover:shadow-pop',
        secondary: 'bg-brand-yellow text-brand-blue shadow-soft hover:bg-brand-yellow/90 hover:shadow-pop',
        outline: 'border border-brand-dark/10 bg-[color:var(--color-surface)] text-brand-blue hover:bg-brand-dark/5',
        ghost: 'bg-transparent text-brand-blue hover:bg-brand-blue/5',
        danger: 'bg-rose-600 text-white hover:bg-rose-700',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-11 px-6 text-sm',
        lg: 'h-13 px-8 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, isLoading, leftIcon, rightIcon, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const _disabled = disabled || isLoading;

    return (
      <Comp
        ref={ref as any}
        className={clsx(buttonVariants({ variant, size }), className)}
        {...(asChild 
          ? { 'aria-disabled': _disabled || undefined } 
          : { disabled: _disabled }
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        
        <span className={clsx(isLoading && 'opacity-0')}>
          {children}
        </span>
        
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

/**
 * Especialización de Link.
 * Agregamos Partial<LinkProps> para mitigar errores de exactOptionalPropertyTypes.
 */
export function ButtonLink({
  href,
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: { 
  href: string; 
  children: React.ReactNode; 
  className?: string;
} & VariantProps<typeof buttonVariants> & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  return (
    <Link 
      href={href} 
      className={clsx(buttonVariants({ variant, size }), className)}
      {...(props as any)} 
    >
      {children}
    </Link>
  );
}