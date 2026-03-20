'use client';

import * as React from 'react';
import clsx from 'clsx';

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
  contentRef: React.RefObject<HTMLDivElement>;
};

const DropdownCtx = React.createContext<Ctx | null>(null);

function useDropdown() {
  const ctx = React.useContext(DropdownCtx);
  if (!ctx) throw new Error('DropdownMenu components must be used within <DropdownMenu>.');
  return ctx;
}

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement>(null!);
  const contentRef = React.useRef<HTMLDivElement>(null!);

  React.useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !contentRef.current?.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <DropdownCtx.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      <div className="relative inline-block">{children}</div>
    </DropdownCtx.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const { setOpen, open, triggerRef } = useDropdown();
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: triggerRef,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen(!open);
        (children as any).props?.onClick?.(e);
      },
      'aria-haspopup': 'menu',
      'aria-expanded': open,
    });
  }
  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
      aria-haspopup="menu"
      aria-expanded={open}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  align = 'end',
  className,
}: {
  children: React.ReactNode;
  align?: 'start' | 'end' | 'center';
  className?: string;
}) {
  const { open, contentRef } = useDropdown();
  if (!open) return null;

  const alignClass = align === 'start' ? 'left-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0';

  return (
    <div
      ref={contentRef}
      role="menu"
      className={clsx(
        'absolute z-50 mt-2 min-w-[12rem] rounded-2xl border border-[color:var(--color-border)]',
        'bg-[color:var(--color-surface)] shadow-pop py-1',
        alignClass,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-[color:var(--color-text-muted)] truncate', className)}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={clsx('my-1 h-px bg-[color:var(--color-border)]', className)} />;
}

export function DropdownMenuItem({
  children,
  className,
  onClick,
  onSelect,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  onSelect?: (e: Event) => void;
  disabled?: boolean;
}) {
  const { setOpen } = useDropdown();

  function handleClick(e: React.MouseEvent) {
    if (disabled) return;
    if (onSelect) {
      onSelect(e.nativeEvent);
    } else if (onClick) {
      onClick();
    }
    setOpen(false);
  }

  return (
    <button
      role="menuitem"
      disabled={disabled}
      onClick={handleClick}
      className={clsx(
        'flex w-full items-center gap-2 px-3 py-2.5 text-sm text-[color:var(--color-text)]',
        'transition-colors hover:bg-[color:var(--color-surface-2)] rounded-xl mx-1 w-[calc(100%-0.5rem)]',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}
