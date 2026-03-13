/* src/features/auth/RegisterForm.tsx */
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

export default function RegisterForm() {
  const pathname = usePathname() || '/';
  const sp = useSearchParams();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [password2, setPassword2] = React.useState('');

  const [status, setStatus] = React.useState<Status>('idle');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const localePrefix = detectLocalePrefix(pathname);
  const defaultNext = `${localePrefix}/wishlist`;
  const nextPath = safeNextPath(sp?.get('next'), defaultNext);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg('La contraseña debe tener mínimo 8 caracteres.');
      setStatus('error');
      return;
    }
    if (password !== password2) {
      setErrorMsg('Las contraseñas no coinciden.');
      setStatus('error');
      return;
    }

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

      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { data, error } = await sb.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) throw error;

      // Si email confirmations están activadas, el usuario debe abrir el link del correo
      if (!data.session) {
        const href = `${localePrefix}/verify-email?email=${encodeURIComponent(email.trim())}&next=${encodeURIComponent(nextPath)}`;
        window.location.href = href;
        return;
      }

      // Si no requiere confirmación, ya hay sesión
      window.location.href = nextPath;
    } catch (err: any) {
      console.error('[RegisterForm] signUp error:', err);
      setErrorMsg(err?.message || 'No pudimos crear la cuenta. Intenta de nuevo.');
      setStatus('error');
    }
  }

  const loginHref = `${localePrefix}/login?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="card p-6">
      <h2 className="font-heading text-xl text-brand-blue">Crear cuenta</h2>
      <p className="text-[color:var(--color-text)]/75 mt-2">
        Crea una cuenta con email y contraseña. Luego podrás restablecerla si la olvidas.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-6 flex flex-col gap-3"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="w-full"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña (mín 8)"
          className="w-full"
          autoComplete="new-password"
          minLength={8}
        />
        <input
          type="password"
          required
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          placeholder="Repite la contraseña"
          className="w-full"
          autoComplete="new-password"
          minLength={8}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            disabled={status === 'sending'}
            isLoading={status === 'sending'}
          >
            Crear cuenta
          </Button>
          <Button
            asChild
            variant="outline"
          >
            <Link href={loginHref}>Ya tengo cuenta</Link>
          </Button>
        </div>
      </form>

      {status === 'sent' ? (
        <p className="text-[color:var(--color-text)]/80 mt-4">
          Listo. Revisa tu correo y abre el enlace para confirmar tu cuenta.
        </p>
      ) : null}

      {status === 'error' && errorMsg ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          <div className="font-semibold">No se pudo crear la cuenta</div>
          <div className="mt-1">{errorMsg}</div>
        </div>
      ) : null}
    </div>
  );
}
