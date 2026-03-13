/* src/features/auth/ForgotPasswordForm.tsx */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

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

export default function ForgotPasswordForm() {
  const pathname = usePathname() || '/';
  const sp = useSearchParams();

  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState<Status>('idle');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState<number>(0);

  const localePrefix = detectLocalePrefix(pathname);
  const defaultNext = `${localePrefix}/wishlist`;
  const nextPath = safeNextPath(sp?.get('next'), defaultNext);

  React.useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (cooldown > 0) return;

    setStatus('sending');

    try {
      const sb = supabaseBrowser();
      if (!sb) {
        setErrorMsg(
          'Auth no configurado. Revisa NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local y reinicia (rm -rf .next).',
        );
        setStatus('error');
        return;
      }

      const redirectTo = `${window.location.origin}/auth/reset-password?next=${encodeURIComponent(nextPath)}`;

      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw error;

      setStatus('sent');
      setCooldown(60);
    } catch (err: any) {
      console.error('[ForgotPassword] reset error:', err);
      const msg = err?.message || 'No se pudo enviar el enlace.';
      if (/rate limit/i.test(msg)) setCooldown(90);
      setErrorMsg(msg);
      setStatus('error');
    }
  }

  const loginHref = `${localePrefix}/login?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="card p-6">
      <h2 className="font-heading text-xl text-brand-blue">Restablecer contraseña</h2>
      <p className="text-[color:var(--color-text)]/75 mt-2">
        Te enviaremos un enlace para crear una nueva contraseña.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 flex flex-col gap-3 sm:flex-row"
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
          disabled={status === 'sending' || cooldown > 0}
          isLoading={status === 'sending'}
        >
          {cooldown > 0 ? `Espera ${cooldown}s` : 'Enviar enlace'}
        </Button>
      </form>

      <div className="mt-4">
        <Button
          asChild
          variant="ghost"
        >
          <Link href={loginHref}>Volver a iniciar sesión</Link>
        </Button>
      </div>

      {status === 'sent' ? (
        <p className="text-[color:var(--color-text)]/80 mt-4">
          Listo. Revisa tu correo y abre el enlace.
        </p>
      ) : null}

      {status === 'error' && errorMsg ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          <div className="font-semibold">No se pudo enviar el enlace</div>
          <div className="mt-1">{errorMsg}</div>
        </div>
      ) : null}
    </div>
  );
}
