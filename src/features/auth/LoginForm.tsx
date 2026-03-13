/* src/features/auth/LoginForm.tsx */
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser';

type Status = 'idle' | 'sending' | 'sent' | 'error';
type Mode = 'password' | 'magic';

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

export default function LoginForm() {
  const pathname = usePathname() || '/';
  const sp = useSearchParams();
  const router = useRouter();

  const [mode, setMode] = React.useState<Mode>('password');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

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

  async function onPasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
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

      const { error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      // Redirige a "next"
      router.replace(nextPath);
      router.refresh();
    } catch (err: any) {
      console.error('[LoginForm] password login error:', err);
      const m = String(err?.message || '');

      // Si activaste verificación obligatoria, Supabase puede negar login hasta confirmar email.
      if (/email not confirmed|confirm(\s+your)?\s+email|correo.*no.*confirmado/i.test(m)) {
        const href = `${localePrefix}/verify-email?email=${encodeURIComponent(email.trim())}&next=${encodeURIComponent(nextPath)}`;
        router.replace(href);
        return;
      }

      if (/failed to fetch|network|522/i.test(m)) {
        setErrorMsg(
          'Parece un problema temporal de conexión con el servidor de autenticación. Intenta de nuevo en unos minutos.',
        );
      } else {
        setErrorMsg(m || 'No pudimos iniciar sesión. Verifica tus datos e intenta de nuevo.');
      }
      setStatus('error');
    }
  }

  async function onMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (cooldown > 0) return;

    setStatus('sending');

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const sb = supabaseBrowser();
      if (!sb) {
        setErrorMsg(
          'Auth no configurado. Revisa NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local y reinicia (rm -rf .next).',
        );
        setStatus('error');
        return;
      }

      const { error } = await sb.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
      });

      if (error) throw error;
      setStatus('sent');
    } catch (err: any) {
      console.error('[LoginForm] OTP error:', err);
      const msg = String(err?.message || 'No se pudo enviar el enlace.');

      if (/failed to fetch|network|522/i.test(msg)) {
        setErrorMsg('Parece un problema temporal de conexión. Intenta de nuevo en unos minutos.');
        setStatus('error');
        return;
      }

      // Supabase cooldown: "For security purposes, you can only request this after 54 seconds."
      const m = /after\s+(\d+)\s+seconds/i.exec(msg);
      if (m) {
        const seconds = Number(m[1] ?? 0);
        if (Number.isFinite(seconds) && seconds > 0) setCooldown(Math.min(seconds, 180));
      }

      // Rate limit: "email rate limit exceeded"
      if (/rate limit/i.test(msg)) {
        setCooldown(Math.max(cooldown, 60));
      }

      setErrorMsg(msg);
      setStatus('error');
    }
  }

  const registerHref = `${localePrefix}/register?next=${encodeURIComponent(nextPath)}`;
  const forgotHref = `${localePrefix}/forgot-password?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl text-brand-blue">Iniciar sesión</h2>
          <p className="text-[color:var(--color-text)]/75 mt-2">
            Puedes entrar con contraseña o por enlace mágico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === 'password' ? 'primary' : 'outline'}
            onClick={() => setMode('password')}
          >
            Contraseña
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'magic' ? 'primary' : 'outline'}
            onClick={() => setMode('magic')}
          >
            Enlace
          </Button>
        </div>
      </div>

      {mode === 'password' ? (
        <form
          onSubmit={onPasswordLogin}
          className="mt-6 flex flex-col gap-3"
        >
          <div className="grid gap-1">
            <label htmlFor="login_email" className="text-sm font-medium text-[color:var(--color-text)]">
              Email
            </label>
            <input
              id="login_email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full"
            />
          </div>

          <div className="grid gap-1">
            <label htmlFor="login_password" className="text-sm font-medium text-[color:var(--color-text)]">
              Contraseña
            </label>
            <input
              id="login_password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full"
              minLength={8}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={status === 'sending'}
              isLoading={status === 'sending'}
            >
              Iniciar sesión
            </Button>
            <Button
              asChild
              variant="outline"
            >
              <Link href={registerHref}>Crear cuenta</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
            >
              <Link href={forgotHref}>¿Olvidaste tu contraseña?</Link>
            </Button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={onMagicLink}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <div className="grid w-full flex-1 gap-1">
            <label htmlFor="magic_email" className="text-sm font-medium text-[color:var(--color-text)]">
              Email
            </label>
            <input
              id="magic_email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={status === 'sending' || cooldown > 0}
            isLoading={status === 'sending'}
          >
            {cooldown > 0 ? `Espera ${cooldown}s` : 'Enviar enlace'}
          </Button>
        </form>
      )}

      {status === 'sent' ? (
        <p className="text-[color:var(--color-text)]/80 mt-4">
          Listo. Revisa tu correo y abre el enlace para iniciar sesión.
        </p>
      ) : null}

      {status === 'error' && errorMsg ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          <div className="font-semibold">No se pudo completar</div>
          <div className="mt-1">{errorMsg}</div>
          <div className="mt-3 text-[0.8125rem] text-red-700/80 dark:text-red-200/80">
            Tip: para probar en celular, abre la web desde la IP de tu PC (por ejemplo{' '}
            <code className="rounded bg-black/5 px-1 py-0.5 font-mono text-xs dark:bg-white/10">
              http://192.168.x.x:3000
            </code>
            ) y solicita el correo desde ahí. Si lo pides desde{' '}
            <code className="rounded bg-black/5 px-1 py-0.5 font-mono text-xs dark:bg-white/10">
              localhost
            </code>
            , el enlace del email también tendrá{' '}
            <code className="font-mono text-xs">localhost</code>.
          </div>
        </div>
      ) : null}
    </div>
  );
}
