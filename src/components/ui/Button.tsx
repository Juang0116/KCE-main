'use client';

import Link from 'next/link';
import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';

// Lightweight replacement for @radix-ui/react-slot to avoid extra dependency.
// Supports <Button asChild><a .../></Button> and merges className + props.
function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') ref(node);
      else {
        try {
          (ref as any).current = node;
        } catch {
          // ignore
        }
      }
    }
  };
}

type SlotProps = React.HTMLAttributes<HTMLElement> & { children: React.ReactElement };

const Slot = React.forwardRef<HTMLElement, SlotProps>(({ children, className, ...props }, ref) => {
  if (!React.isValidElement(children)) return null;
  const childProps: any = (children as any).props || {};
  return React.cloneElement(children as any, {
    ...props,
    ...childProps,
    className: clsx(childProps.className, className),
    ref: composeRefs(ref as any, (children as any).ref),
  });
});
Slot.displayName = 'Slot';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-xl font-heading transition',
    'focus-visible:shadow-[var(--focus-ring)] focus-visible:outline-none',
    'disabled:cursor-not-allowed disabled:opacity-60',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: 'bg-brand-blue text-white shadow-soft hover:shadow-pop',
        secondary: 'bg-brand-yellow text-[color:var(--color-text)] shadow-soft hover:shadow-pop',
        accent: 'bg-brand-yellow text-[color:var(--color-text)] shadow-soft hover:shadow-pop',
        outline:
          'border border-[var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-2)]',
        ghost:
          'bg-transparent text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-2)]',
        danger: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-5 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild,
      isLoading,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp: any = asChild ? Slot : 'button';
    const isDisabled = Boolean(disabled || isLoading);

    return (
      <Comp
        ref={ref}
        className={clsx(
          buttonVariants({ variant, size }),
          isDisabled && asChild && 'pointer-events-none opacity-60',
          className,
        )}
        {...(asChild ? { 'aria-disabled': isDisabled || undefined } : { disabled: isDisabled })}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            <span className="sr-only">Cargando</span>
          </span>
        ) : null}
        {!isLoading ? leftIcon : null}
        <span className={clsx(isLoading && 'sr-only')}>{children}</span>
        {!isLoading ? rightIcon : null}
      </Comp>
    );
  },
);

Button.displayName = 'Button';

export function ButtonLink({
  href,
  children,
  className,
  variant = 'primary',
  size = 'md',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: VariantProps<typeof buttonVariants>['variant'];
  size?: VariantProps<typeof buttonVariants>['size'];
}) {
  return (
    <Link
      href={href}
      className={clsx(buttonVariants({ variant, size }), className)}
    >
      {children}
    </Link>
  );
}
