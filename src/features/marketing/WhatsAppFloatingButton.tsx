// src/features/marketing/WhatsAppFloatingButton.tsx
'use client';

import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { buildWhatsAppHref } from '@/features/marketing/whatsapp';

function WaIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={props.className}
      fill="currentColor"
    >
      <path d="M19.11 17.42c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.17.25-.64.8-.78.97-.14.17-.28.19-.53.06-.25-.12-1.05-.39-2-1.24-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.28.37-.42.12-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.41-.56-.42-.14-.01-.31-.01-.48-.01-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.02 2.6.12.17 1.77 2.71 4.29 3.8.6.26 1.06.41 1.42.53.6.19 1.15.16 1.58.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.28zM16 3C8.82 3 3 8.73 3 15.8c0 2.51.75 4.83 2.03 6.77L3 29l6.62-2.08c1.86 1.01 3.99 1.59 6.38 1.59 7.18 0 13-5.73 13-12.8S23.18 3 16 3zm0 23.26c-2.25 0-4.33-.67-6.06-1.82l-.43-.27-3.93 1.23 1.26-3.72-.29-.46a11.2 11.2 0 0 1-1.73-5.95c0-6.19 5.07-11.22 11.18-11.22 6.11 0 11.18 5.03 11.18 11.22 0 6.19-5.07 11.22-11.18 11.22z" />
    </svg>
  );
}

export default function WhatsAppFloatingButton() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const [chatOpen, setChatOpen] = React.useState(false);

  React.useEffect(() => {
    const onOpen = () => setChatOpen(true);
    const onClose = () => setChatOpen(false);

    // Back-compat: older buttons dispatch open/close directly.
    window.addEventListener('kce:open-chat', onOpen as any);
    window.addEventListener('kce:close-chat', onClose as any);

    // Preferred: ChatWidget broadcasts real open/close state.
    window.addEventListener('kce:chat-opened', onOpen as any);
    window.addEventListener('kce:chat-closed', onClose as any);
    return () => {
      window.removeEventListener('kce:open-chat', onOpen as any);
      window.removeEventListener('kce:close-chat', onClose as any);
      window.removeEventListener('kce:chat-opened', onOpen as any);
      window.removeEventListener('kce:chat-closed', onClose as any);
    };
  }, []);

  const href = React.useMemo(() => {
    const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
    if (!number.trim()) return '';

    const baseMsg =
      process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE ||
      'Hola KCE, quiero información sobre un tour.';
    const url = `${pathname || ''}${sp?.toString() ? `?${sp.toString()}` : ''}`;

    return buildWhatsAppHref({ number, message: baseMsg, url });
  }, [pathname, sp]);

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`fixed ${chatOpen ? 'pointer-events-none opacity-0' : ''} bottom-6 right-6 z-[45] inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-soft transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300`}
      aria-label="Abrir WhatsApp"
      title="WhatsApp"
    >
      <WaIcon className="h-6 w-6" />
    </a>
  );
}
