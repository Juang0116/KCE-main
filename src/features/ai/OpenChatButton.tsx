// src/features/ai/OpenChatButton.tsx
'use client';

import * as React from 'react';

import { Button } from '@/components/ui/Button';

type ButtonBaseProps = React.ComponentProps<typeof Button>;

type Props = Omit<ButtonBaseProps, 'onClick'> & {
  /** Abre el chat cuando el botón se monta (espera 1 tick para que el widget registre listeners). */
  openOnMount?: boolean;
  /** Añade/actualiza ?chat=open en la URL (sin recargar la página). */
  addQueryParam?: boolean;
  /** onClick adicional del consumidor (se llama antes de abrir el chat). */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export default function OpenChatButton({
  children = 'Ask our AI Guide',
  variant = 'secondary', // <-- Cambiado de 'accent' a 'secondary' para coincidir con los tipos permitidos
  className,
  openOnMount = false,
  addQueryParam = true,
  onClick,
  ...btnProps
}: Props) {
  const openChat = React.useCallback(() => {
    if (typeof window === 'undefined') return;

    // Hash fallback: enables deep-linking (#chat) and helps on some mobile webviews
    // where custom events can be unreliable.
    try {
      if (window.location.hash !== '#chat') window.location.hash = 'chat';
    } catch {
      /* ignore */
    }

    // 1) API directa si el widget ya expuso el helper
    const api = (window as any).kce;
    if (api?.openChat) {
      api.openChat();
    } else {
      // 2) Fallback: evento global (el ChatWidget escucha kce:open-chat)
      try {
        window.dispatchEvent(new CustomEvent('kce:open-chat', { detail: { source: 'button' } }));
      } catch {
        window.dispatchEvent(new Event('kce:open-chat'));
      }
    }

    // 3) Query param opcional (?chat=open), evitando duplicados
    if (addQueryParam) {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('chat') !== 'open') {
          url.searchParams.set('chat', 'open');
          window.history.replaceState({}, '', url.toString());
        }
      } catch {
        /* ignore */
      }
    }
  }, [addQueryParam]);

  // Garantiza que openOnMount ocurra después de que el ChatWidget
  // haya registrado sus listeners (siguiente tick).
  React.useEffect(() => {
    if (!openOnMount) return;
    const t = setTimeout(() => openChat(), 0);
    return () => clearTimeout(t);
  }, [openOnMount, openChat]);

  return (
    <Button
      variant={variant}
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        openChat();
      }}
      title={typeof children === 'string' ? children : 'Abrir chat de asistencia'}
      aria-label={typeof children === 'string' ? children : 'Abrir chat de asistencia'}
      data-cta="open-chat"
      {...btnProps}
    >
      {children}
    </Button>
  );
}