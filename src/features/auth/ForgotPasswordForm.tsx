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

      const redirectTo = `${window.location.origin}/auth/reset-password?next=${encodeURIComponent(nextPath)}`;
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
      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-10 text-center shadow-xl">
        <CheckCircle2 className="mx-auto h-12 w-12 text-brand-blue mb-4" />
        <h2 className="font-heading text-2xl text-brand-blue mb-2">Revisa tu correo</h2>
        <p className="text-sm font-light text-[var(--color-text)]/70 mb-6 leading-relaxed">
          Te hemos enviado un enlace seguro para restablecer tu contraseña. Puedes cerrar esta pestaña.
        </p>
        <Link href={loginHref} className="text-xs font-bold uppercase tracking-widest text-brand-blue hover:text-brand-dark transition-colors">
          Volver a Inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-10 shadow-xl">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue/10 mb-4">
          <KeyRound className="h-6 w-6 text-brand-blue" />
        </div>
        <h2 className="font-heading text-3xl text-[var(--color-text)]">Recuperar acceso</h2>
        <p className="text-sm font-light text-[var(--color-text)]/70 mt-2">
          Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
        </p>
      </div>

      {status === 'error' && errorMsg && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[var(--color-text)]/30">
            <Mail className="h-5 w-5" />
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="viajero@email.com"
            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] pl-11 pr-4 py-3.5 text-sm outline-none focus:border-brand-blue focus:bg-[var(--color-surface)] transition-all placeholder:font-light"
            disabled={status === 'sending' || cooldown > 0}
          />
        </div>
        
        <button
          type="submit"
          disabled={status === 'sending' || cooldown > 0}
          className="w-full flex items-center justify-center rounded-full bg-brand-blue px-6 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 shadow-md disabled:opacity-50"
        >
          {status === 'sending' ? 'Enviando...' : cooldown > 0 ? `Espera ${cooldown}s` : 'Enviar enlace seguro'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-center">
        <Link href={loginHref} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text)]/50 hover:text-brand-blue transition-colors">
          <ArrowLeft className="h-3 w-3" /> Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}