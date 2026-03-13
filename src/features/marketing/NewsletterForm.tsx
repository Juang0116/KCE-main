'use client';

import * as React from 'react';

import { Button } from '@/components/ui/Button';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]!) : null;
}

function readUtm(): Record<string, any> | null {
  try {
    const raw = localStorage.getItem('kce.utm');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function nullToUndefined<T>(v: T | null | undefined): T | undefined {
  return v == null ? undefined : v;
}

export default function NewsletterForm() {
  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = React.useState<string>('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMsg('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source: 'newsletter_page',
          utm: nullToUndefined(readUtm()),
          visitorId: nullToUndefined(getCookie('kce_vid')),
          language: (navigator.language || '').slice(0, 5),
        }),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || !data?.ok) {
        const rid = data?.requestId ? ` (Req: ${String(data.requestId)})` : '';
        throw new Error(`request_failed${rid}`);
      }

      setStatus('ok');
      setMsg('Listo. Revisa tu correo y confirma la suscripción.');
      setEmail('');
    } catch (err: any) {
      setStatus('error');
      const m = String(err?.message || '').trim();
      setMsg(m ? `No se pudo enviar${m.includes('Req:') ? ` ${m.slice(m.indexOf('(Req:'))}` : ''}.` : 'No se pudo enviar. Intenta de nuevo en un minuto.');
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 flex w-full max-w-xl flex-col gap-3 sm:flex-row"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        className="w-full flex-1"
      />
      <Button
        type="submit"
        variant="primary"
        disabled={status === 'loading'}
        isLoading={status === 'loading'}
      >
        Suscribirme
      </Button>

      {msg ? (
        <p
          className={`w-full text-sm ${status === 'error' ? 'text-red-600 dark:text-red-200' : 'text-[color:var(--color-text)]/80'}`}
        >
          {msg}
        </p>
      ) : null}
    </form>
  );
}
