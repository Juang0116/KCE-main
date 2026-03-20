'use client';

import * as React from 'react';

import { Button } from '@/components/ui/Button';
import { buildWhatsAppHref } from '@/features/marketing/whatsapp';
import { Copy, MessageCircleMore, Share2 } from 'lucide-react';

type Props = {
  /** URL completa (ideal) o relativa (fallback) del booking actual, incluyendo ?t= si aplica */
  bookingUrl: string;
  /** Texto para prellenar el mensaje de soporte */
  supportContext: {
    tourTitle?: string | null;
    customerEmail?: string | null;
    sessionId: string;
  };
  className?: string;
};

function safe(v: string | null | undefined) {
  return (v ?? '').trim();
}

export default function BookingActionBar({ bookingUrl, supportContext, className }: Props) {
  const [copied, setCopied] = React.useState(false);
  const [shared, setShared] = React.useState(false);

  const waHref = React.useMemo(() => {
    const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';
    const baseMsg =
      process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE ||
      'Hola KCE, necesito ayuda con mi reserva.';

    const msg = [
      baseMsg,
      '',
      `Session: ${supportContext.sessionId}`,
      safe(supportContext.tourTitle) ? `Tour: ${safe(supportContext.tourTitle)}` : '',
      safe(supportContext.customerEmail) ? `Email: ${safe(supportContext.customerEmail)}` : '',
      '',
      'Por favor ayúdame con:',
      '- (escribe aquí tu solicitud)',
    ]
      .filter(Boolean)
      .join('\n');

    return buildWhatsAppHref({ number, message: msg, url: bookingUrl });
  }, [
    bookingUrl,
    supportContext.customerEmail,
    supportContext.sessionId,
    supportContext.tourTitle,
  ]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = bookingUrl;
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      } catch {
        // silencio
      }
    }
  };

  const onShare = async () => {
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await navigator.share({
          title: safe(supportContext.tourTitle) || 'Reserva KCE',
          text: 'Aquí está mi booking de KCE.',
          url: bookingUrl,
        });
        setShared(true);
        window.setTimeout(() => setShared(false), 1400);
      } else {
        await onCopy();
      }
    } catch {
      // noop
    }
  };

  return (
    <div className={className || ''}>
      <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">
          soporte y acceso rápido
        </p>
        <p className="mt-2 text-sm text-[color:var(--color-text)]/72">
          Copia o comparte este acceso y entra a soporte con el contexto exacto de tu compra.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={onCopy} leftIcon={<Copy className="size-4" aria-hidden="true" />}>
            {copied ? '✅ Copiado' : 'Copiar enlace'}
          </Button>

          <Button type="button" variant="outline" onClick={onShare} leftIcon={<Share2 className="size-4" aria-hidden="true" />}>
            {shared ? '✅ Compartido' : 'Compartir'}
          </Button>

          {waHref ? (
            <a href={waHref} target="_blank" rel="noreferrer">
              <Button type="button" variant="outline" leftIcon={<MessageCircleMore className="size-4" aria-hidden="true" />}>
                WhatsApp
              </Button>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
