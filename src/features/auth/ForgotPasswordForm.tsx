/*src/features/auth/ForgotPasswordForm.tsx*/
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { KeyRound, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

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
        setErrorMsg('Error de conexión. Por favor, recarga la página.');
        setStatus('error');
        return;
      }

      // ✅ PRO FIX: Mismo confirmador, este sabrá que es un reset por el hash en la URL
      const redirectTo = `${window.location.origin}/api/auth/confirm?next=${encodeURIComponent(nextPath)}`;
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw error;

      setStatus('sent');
      setCooldown(60);
    } catch (err: any) {
      const msg = err?.message || 'No se pudo enviar el enlace.';
      if (/rate limit/i.test(msg)) setCooldown(90);
      setErrorMsg(msg);
      setStatus('error');
    }
  }

  const loginHref = `${localePrefix}/login?next=${encodeURIComponent(nextPath)}`;

  if (status === 'sent') {
    return (
      <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 text-center shadow-xl md:p-10">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-brand-blue" />
        <h2 className="mb-2 font-heading text-2xl text-brand-blue">Revisa tu correo</h2>
        <p className="text-[color:var(--color-text)]/70 mb-6 text-sm font-light leading-relaxed">
          Te hemos enviado un enlace seguro para restablecer tu contraseña. Puedes cerrar esta
          pestaña.
        </p>
        <Link
          href={loginHref}
          className="text-xs font-bold uppercase tracking-widest text-brand-blue transition-colors hover:text-[color:var(--color-text)]"
        >
          Volver a Inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 shadow-xl md:p-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue/10">
          <KeyRound className="h-6 w-6 text-brand-blue" />
        </div>
        <h2 className="font-heading text-3xl text-[color:var(--color-text)]">Recuperar acceso</h2>
        <p className="text-[color:var(--color-text)]/70 mt-2 text-sm font-light">
          Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
        </p>
      </div>

      {status === 'error' && errorMsg && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-4"
      >
        <div className="relative">
          <div className="text-[color:var(--color-text)]/30 pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Mail className="h-5 w-5" />
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="viajero@email.com"
            className="w-full rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] py-3.5 pl-11 pr-4 text-sm outline-none transition-all placeholder:font-light focus:border-brand-blue focus:bg-[color:var(--color-surface)]"
            disabled={status === 'sending' || cooldown > 0}
          />
        </div>

        <button
          type="submit"
          disabled={status === 'sending' || cooldown > 0}
          className="flex w-full items-center justify-center rounded-full bg-brand-blue px-6 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-md transition hover:bg-brand-blue/90 disabled:opacity-50"
        >
          {status === 'sending'
            ? 'Enviando...'
            : cooldown > 0
              ? `Espera ${cooldown}s`
              : 'Enviar enlace seguro'}
        </button>
      </form>

      <div className="mt-8 border-t border-[color:var(--color-border)] pt-6 text-center">
        <Link
          href={loginHref}
          className="text-[color:var(--color-text)]/50 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors hover:text-brand-blue"
        >
          <ArrowLeft className="h-3 w-3" /> Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}
