'use client';

import * as React from 'react';
import clsx from 'clsx';

// 1. Ajustamos el tipo de la Ref en el Contexto
type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>; // Sin el "| null" aquí
  contentRef: React.RefObject<HTMLDivElement>; // Sin el "| null" aquí
};

const DropdownCtx = React.createContext<Ctx | null>(null);

function useDropdown() {
  const ctx = React.useContext(DropdownCtx);
  if (!ctx) throw new Error('DropdownMenu components must be used within <DropdownMenu>.');
  return ctx;
}

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  
  // 2. Inicializamos los refs con el tipo base. 
  // React.useRef<T>(null) devuelve un RefObject<T> que TS acepta felizmente.
  const triggerRef = React.useRef<HTMLElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || contentRef.current?.contains(target)) return;
      setOpen(false);
    };
    // ... resto del effect
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const value = React.useMemo(() => ({ open, setOpen, triggerRef, contentRef }), [open]);

  return (
    <DropdownCtx.Provider value={value}>
      <div className="relative inline-block">{children}</div>
    </DropdownCtx.Provider>
  );
}

export function DropdownMenuContent({
  children,
  align = 'end',
  className,
}: {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}) {
  const { open, contentRef } = useDropdown();
  if (!open) return null;

  const alignClasses = {
    start: 'left-0 origin-top-left',
    center: 'left-1/2 -translate-x-1/2 origin-top',
    end: 'right-0 origin-top-right',
  };

  return (
    <div
      ref={contentRef} // <--- TS ahora debería estar en silencio y feliz
      role="menu"
      className={clsx(
        'absolute z-50 mt-2 min-w-[12rem] overflow-hidden rounded-2xl border border-brand-dark/10 bg-white p-1.5 shadow-hard',
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
}
// ── Additional exports needed by HeaderAuthButton ──────────────────────────

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
      onClick: () => setOpen(!open),
      'aria-haspopup': 'menu',
      'aria-expanded': open,
    });
  }
  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      onClick={() => setOpen(!open)}
      aria-haspopup="menu"
      aria-expanded={open}
    >
      {children}
    </button>
  );
}

export function DropdownMenuLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[color:var(--color-text-muted)] ${className ?? ''}`}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={`my-1 h-px bg-[color:var(--color-border)] ${className ?? ''}`} />;
}

export function DropdownMenuItem({
  children,
  className,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-surface-2)] disabled:pointer-events-none disabled:opacity-50 ${className ?? ''}`}
    >
      {children}
    </button>
  );
}
