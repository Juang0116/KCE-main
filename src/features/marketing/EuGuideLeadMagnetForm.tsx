'use client';

import * as React from 'react';

import { Button } from '@/components/ui/Button';

export default function EuGuideLeadMagnetForm() {
  const [email, setEmail] = React.useState('');
  const [consent, setConsent] = React.useState(true);
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = React.useState<string>('');
  const [downloadUrl, setDownloadUrl] = React.useState<string>('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMsg('');
    setDownloadUrl('');

    try {
      const res = await fetch('/api/lead-magnets/eu-guide', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), consent }),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok || !data?.ok) {
        const rid = data?.requestId ? ` (Req: ${String(data.requestId)})` : '';
        throw new Error(`request_failed${rid}`);
      }

      setStatus('ok');
      setMsg(
        data?.emailSent
          ? 'Listo. Te enviamos la guía por email.'
          : 'Listo. Puedes descargar la guía aquí (email no disponible en este entorno).',
      );
      setDownloadUrl(String(data?.downloadUrl || ''));
      setEmail('');
    } catch (err: any) {
      setStatus('error');
      const m = String(err?.message || '').trim();
      setMsg(
        m
          ? `No se pudo enviar${m.includes('Req:') ? ` ${m.slice(m.indexOf('(Req:'))}` : ''}.`
          : 'No se pudo enviar. Intenta de nuevo en un minuto.',
      );
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 w-full max-w-xl"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
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
          Recibir guía
        </Button>
      </div>

      <label className="mt-3 flex items-start gap-2 text-sm text-[color:var(--color-text)]/75">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
        />
        <span>
          Acepto que me contacten con recomendaciones y ofertas relacionadas.
        </span>
      </label>

      {msg ? (
        <p
          className={`mt-3 text-sm ${status === 'error' ? 'text-red-600 dark:text-red-200' : 'text-[color:var(--color-text)]/80'}`}
        >
          {msg}
          {downloadUrl ? (
            <>
              {' '}
              <a
                href={downloadUrl}
                className="text-brand-blue underline underline-offset-4 hover:opacity-90"
                target="_blank"
                rel="noreferrer"
              >
                (Descargar PDF)
              </a>
            </>
          ) : null}
        </p>
      ) : null}
    </form>
  );
}
