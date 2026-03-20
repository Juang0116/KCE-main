'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { MailCheck, ArrowLeft, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  const nextPath = safeNextPath(sp?.get('next'), `${localePrefix}/wishlist`);

  const [email, setEmail] = React.useState((initialEmail || sp?.get('email') || '').trim());
  const [status, setStatus] = React.useState<Status>('idle');
  const [msg, setMsg] = React.useState<string>('');

  async function resend() {
    setStatus('sending'); setMsg('');
    try {
      const sb = supabaseBrowser();
      if (!sb) { setStatus('error'); setMsg('Error de conexión.'); return; }
      if (!email.trim()) { setStatus('error'); setMsg('Escribe tu correo.'); return; }

      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error } = await sb.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: redirectTo } });
      if (error) throw error;

      setStatus('sent'); setMsg('¡Listo! Revisa tu bandeja de entrada.');
    } catch (err: any) {
      setStatus('error'); setMsg(err?.message || 'No se pudo reenviar el correo.');
    }
  }

  const loginHref = `${localePrefix}/login?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 md:p-10 shadow-xl text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue/10 mb-6">
        <MailCheck className="h-8 w-8 text-brand-blue" />
      </div>
      <h1 className="font-heading text-3xl text-[color:var(--color-text)] mb-3">Verifica tu correo</h1>
      <p className="text-sm font-light text-[color:var(--color-text)]/70 mb-8 leading-relaxed">
        Para mantener tu cuenta segura, hemos enviado un enlace de confirmación. Por favor, haz clic en él para activar tu cuenta KCE.
      </p>

      <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-6 text-left">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50 mb-3">
          ¿No te llegó el correo?
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-brand-blue"
          />
          <button
            onClick={resend}
            disabled={status === 'sending'}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 shadow-sm disabled:opacity-50"
          >
            {status === 'sending' ? '...' : <><Send className="h-3 w-3"/> Reenviar</>}
          </button>
        </div>

        {msg && (
          <div className={`mt-4 flex items-start gap-2 text-xs p-3 rounded-lg border ${status === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {status === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {msg}
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-[color:var(--color-border)]">
        <Link href={loginHref} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[color:var(--color-text)]/50 hover:text-brand-blue transition-colors">
          <ArrowLeft className="h-3 w-3" /> Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}