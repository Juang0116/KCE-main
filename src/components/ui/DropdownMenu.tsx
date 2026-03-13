/*
  Lightweight dropdown menu (no Radix dependency).
  API is intentionally similar to shadcn/ui's DropdownMenu so we can swap later.
*/

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
  const triggerRef = React.useRef<HTMLElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onDocPointerDown(e: MouseEvent | TouchEvent) {
      if (!open) return;
      const t = e.target as Node | null;
      if (!t) return;
      if (triggerRef.current?.contains(t)) return;
      if (contentRef.current?.contains(t)) return;
      setOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onDocPointerDown);
    document.addEventListener('touchstart', onDocPointerDown, { passive: true });
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocPointerDown);
      document.removeEventListener('touchstart', onDocPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const value = React.useMemo<Ctx>(() => ({ open, setOpen, triggerRef, contentRef }), [open]);
  return <DropdownCtx.Provider value={value}>{children}</DropdownCtx.Provider>;
}

export function DropdownMenuTrigger({
  children,
  asChild,
}: {
  children: React.ReactElement;
  asChild?: boolean;
}) {
  const { open, setOpen, triggerRef } = useDropdown();
  const child = React.Children.only(children);

  const props = {
    ref: triggerRef as any,
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    onClick: (e: React.MouseEvent) => {
      child.props?.onClick?.(e);
      setOpen(!open);
    },
  };

  return asChild ? React.cloneElement(child, props) : React.cloneElement(child, props);
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

  const alignClass =
    align === 'start' ? 'left-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0';

  return (
    <div
      ref={contentRef}
      role="menu"
      className={clsx(
        'absolute z-50 mt-2 min-w-48 overflow-hidden rounded-xl border border-black/10 bg-[color:var(--color-surface)] shadow-soft',
        'focus:outline-none',
        alignClass,
        className,
      )}
    >
      <div className="py-1">{children}</div>
    </div>
  );
}

export function DropdownMenuItem({
  children,
  className,
  onSelect,
}: {
  children: React.ReactNode;
  className?: string;
  onSelect?: (e: Event) => void;
}) {
  const { setOpen } = useDropdown();

  return (
    <button
      type="button"
      role="menuitem"
      className={clsx(
        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[color:var(--color-text)]',
        'hover:bg-black/5 focus:bg-black/5 focus:outline-none',
        className,
      )}
      onClick={(e) => {
        const nativeEvent = (e as unknown as { nativeEvent?: Event }).nativeEvent;
        if (nativeEvent && onSelect) onSelect(nativeEvent);
        if (!nativeEvent || !nativeEvent.defaultPrevented) setOpen(false);
      }}
    >
      {children}
    </button>
  );
}

export function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-black/60">
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-black/10" role="separator" />;
}
