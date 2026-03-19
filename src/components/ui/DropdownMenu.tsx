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