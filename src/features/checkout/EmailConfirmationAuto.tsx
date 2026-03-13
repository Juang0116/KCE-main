/* src/features/checkout/EmailConfirmationAuto.tsx */
'use client';

import * as React from 'react';

import { Button } from '@/components/ui/Button';

type Props = {
  sessionId: string;
  paid: boolean;
};

type State =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent'; to?: string; hasPdf?: boolean; alreadySent?: boolean }
  | { status: 'error'; message: string };

function storageKey(sessionId: string) {
  return `kce:booking_email:${sessionId}`;
}

export function EmailConfirmationAuto({ sessionId, paid }: Props) {
  const [state, setState] = React.useState<State>({ status: 'idle' });

  const send = React.useCallback(async () => {
    if (!paid) return;
    const key = storageKey(sessionId);

    // Prevent noisy retries on refresh.
    try {
      const prev = localStorage.getItem(key);
      if (prev === 'sent') {
        setState({ status: 'sent', alreadySent: true });
        return;
      }
    } catch {
      // ignore
    }

    setState({ status: 'sending' });

    try {
      const res = await fetch('/api/email/booking-confirmation/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const j = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(String(j?.error || 'No pudimos enviar la confirmación.'));
      }

      if (j?.alreadySent) {
        try {
          localStorage.setItem(key, 'sent');
        } catch {
          // ignore
        }
        setState({ status: 'sent', alreadySent: true });
        return;
      }

      try {
        localStorage.setItem(key, 'sent');
      } catch {
        // ignore
      }

      setState({ status: 'sent', to: j?.to, hasPdf: Boolean(j?.hasPdf) });
    } catch (e) {
      setState({ status: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  }, [paid, sessionId]);

  // Auto-send once on mount (paid only)
  React.useEffect(() => {
    if (!paid) return;
    void send();
  }, [paid, send]);

  if (!paid) return null;

  return (
    <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
      <div className="text-xs uppercase tracking-wide text-[color:var(--color-text)]/60">
        Confirmación por email
      </div>

      {state.status === 'idle' || state.status === 'sending' ? (
        <p className="mt-2 text-sm text-[color:var(--color-text)]/75">
          {state.status === 'sending'
            ? 'Enviando confirmación…'
            : 'Enviaremos tu confirmación y la factura PDF a tu correo.'}
        </p>
      ) : null}

      {state.status === 'sent' ? (
        <p className="mt-2 text-sm text-[color:var(--color-text)]/75">
          {state.alreadySent
            ? 'La confirmación ya fue enviada anteriormente para esta sesión.'
            : `Confirmación enviada${state.to ? ` a ${state.to}` : ''}.`}
          {state.hasPdf === false ? ' (Sin PDF: lo enviaremos en un segundo intento si es necesario.)' : ''}
        </p>
      ) : null}

      {state.status === 'error' ? (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-red-600">{state.message}</p>
          <Button onClick={send} className="px-4 py-2" type="button">
            Reintentar envío
          </Button>
        </div>
      ) : null}
    </div>
  );
}
