'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser';

type Status = 'idle' | 'sending' | 'sent' | 'error';

function detectLocalePrefix(pathname: string) {
  const seg = pathname.split('/').filter(Boolean)[0] || '';
  if (/^(es|en|de|fr)$/i.test(seg)) return `/${seg.toLowerCase()}`;
  return '';
}

function safeNextPath(nextParam: string | null, fallback: string) {
  const n = (nextParam ?? '').trim();
  if (!n) return fallback;
  if (!n.startsWith('/') || n.startsWith('//')) return fallback;
  return n;
}

export default function VerifyEmailView({ initialEmail }: { initialEmail?: string }) {
  const pathname = usePathname() || '/';
  const sp = useSearchParams();

  const localePrefix = detectLocalePrefix(pathname);
  const defaultNext = `${localePrefix}/wishlist`;
  const nextPath = safeNextPath(sp?.get('next'), defaultNext);

  const [email, setEmail] = React.useState((initialEmail || sp?.get('email') || '').trim());
  const [status, setStatus] = React.useState<Status>('idle');
  const [msg, setMsg] = React.useState<string>('');

  async function resend() {
    setStatus('sending');
    setMsg('');

    try {
      const sb = supabaseBrowser();
      if (!sb) {
        setStatus('error');
        setMsg(
          'Auth no configurado. Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        );
        return;
      }

      const e = email.trim();
      if (!e) {
        setStatus('error');
        setMsg('Escribe tu correo para reenviar la verificación.');
        return;
      }

      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { error } = await sb.auth.resend({
        type: 'signup',
        email: e,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;

      setStatus('sent');
      setMsg('Listo. Te enviamos un nuevo correo de verificación.');
    } catch (err: any) {
      const m = String(err?.message || 'No se pudo reenviar el correo.');
      setStatus('error');
      setMsg(m);
    }
  }

  const loginHref = `${localePrefix}/login?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="card p-6">
      <h2 className="font-heading text-xl text-brand-blue">Verifica tu correo</h2>
      <p className="text-[color:var(--color-text)]/75 mt-2">
        Para activar tu cuenta, abre el enlace de verificación que te llegó al correo.
      </p>

      <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-4">
        <div className="text-sm font-semibold text-[color:var(--color-text)]">
          ¿No te llegó el correo?
        </div>
        <div className="text-[color:var(--color-text)]/70 mt-1 text-sm">
          Revisa spam / promociones. Si quieres, lo reenviamos.
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full flex-1"
          />
          <Button
            type="button"
            variant="primary"
            onClick={() => void resend()}
            disabled={status === 'sending'}
            isLoading={status === 'sending'}
          >
            Reenviar
          </Button>
        </div>

        {msg ? (
          <div
            className={
              'mt-3 rounded-2xl border p-3 text-sm ' +
              (status === 'error'
                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-100')
            }
          >
            {msg}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <Link href={loginHref}>Volver a login</Link>
          </Button>
          <div className="text-[color:var(--color-text)]/60 text-xs">
            Tip: si usas Gmail, revisa “Promociones” y “Spam”.
          </div>
        </div>
      </div>
    </div>
  );
}
