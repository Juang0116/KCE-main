'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowRight, Lock, Mail, CheckCircle2 } from 'lucide-react';

import { supabaseBrowser } from '@/lib/supabase/browser';

type Status = 'idle' | 'sending' | 'success';

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

export default function RegisterForm({ locale = 'es' }: { locale?: 'es' | 'en' | 'fr' | 'de' }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [status, setStatus] = React.useState<Status>('idle');
  const [error, setError] = React.useState('');

  const nextUrl = searchParams.get('next') || withLocale(locale, '/account');

  // Traducciones
  const tEmail = locale === 'en' ? 'Email' : locale === 'fr' ? 'E-mail' : locale === 'de' ? 'E-Mail' : 'Correo electrónico';
  const tPass = locale === 'en' ? 'Password (6+ chars)' : locale === 'fr' ? 'Mot de passe (6+ car.)' : locale === 'de' ? 'Passwort (6+ Zeichen)' : 'Contraseña (mínimo 6)';
  const tSubmit = locale === 'en' ? 'Create account' : locale === 'fr' ? 'Créer un compte' : locale === 'de' ? 'Konto erstellen' : 'Crear cuenta ahora';
  const tSubmitting = locale === 'en' ? 'Creating...' : locale === 'fr' ? 'Création...' : locale === 'de' ? 'Erstellen...' : 'Creando...';
  const tSuccessTitle = locale === 'en' ? 'Check your email' : locale === 'fr' ? 'Vérifiez vos e-mails' : locale === 'de' ? 'E-Mail prüfen' : 'Revisa tu correo';
  const tSuccessBody = locale === 'en' ? 'We sent a verification link to your email. You can close this tab and continue from there.' : locale === 'fr' ? 'Nous avons envoyé un lien de vérification à votre adresse e-mail.' : locale === 'de' ? 'Wir haben einen Bestätigungslink an Ihre E-Mail gesendet.' : 'Te enviamos un enlace de verificación para asegurar tu cuenta.';
  const tHasAccount = locale === 'en' ? "Already have an account?" : locale === 'fr' ? 'Vous avez déjà un compte ?' : locale === 'de' ? 'Haben Sie bereits ein Konto?' : '¿Ya tienes cuenta?';
  const tLogin = locale === 'en' ? 'Sign in' : locale === 'fr' ? 'Se connecter' : locale === 'de' ? 'Anmelden' : 'Inicia sesión';

  const loginHref = withLocale(locale, '/login') + (searchParams.toString() ? `?${searchParams.toString()}` : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (password.length < 6) {
      setError(locale === 'en' ? 'Password must be at least 6 characters' : 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setStatus('sending');
    setError('');

    const supabase = supabaseBrowser();

    // 🛡️ FIX: Validamos que Supabase no sea null antes de usarlo
    if (!supabase) {
      setError('Error de conexión con el servidor. Intenta recargar la página.');
      setStatus('idle');
      return;
    }

    // Importante: le decimos a Supabase a dónde redirigir al verificar el correo
    const redirectTo = new URL(withLocale(locale, '/api/auth/confirm'), window.location.origin);
    redirectTo.searchParams.set('next', nextUrl);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo.toString(),
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      setStatus('success');
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta');
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-12 w-12 text-brand-blue mb-4" />
        <h2 className="font-heading text-2xl text-brand-blue mb-2">{tSuccessTitle}</h2>
        <p className="text-sm font-light text-[color:var(--color-text)]/80 leading-relaxed mb-6">
          {tSuccessBody}
        </p>
        <Link href={loginHref} className="text-xs font-bold uppercase tracking-widest text-brand-blue hover:text-[color:var(--color-text)] transition-colors underline underline-offset-4">
          Volver a inicio
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-500/20 shadow-sm flex items-start gap-3">
          <Lock className="h-4 w-4 shrink-0 mt-0.5"/> <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50 ml-1">{tEmail}</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[color:var(--color-text)]/30">
            <Mail className="h-5 w-5" />
          </div>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="viajero@email.com"
            className="w-full rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] pl-11 pr-4 py-3.5 text-sm outline-none focus:border-brand-blue focus:bg-[color:var(--color-surface)] transition-all placeholder:font-light"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'sending'}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50 ml-1">{tPass}</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[color:var(--color-text)]/30">
            <Lock className="h-5 w-5" />
          </div>
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] pl-11 pr-4 py-3.5 text-sm outline-none focus:border-brand-blue focus:bg-[color:var(--color-surface)] transition-all placeholder:font-light"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={status === 'sending'}
          />
        </div>
      </div>

      <button 
        type="submit" 
        className="w-full flex items-center justify-center gap-2 rounded-full bg-brand-blue px-6 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 shadow-md hover:shadow-lg disabled:opacity-50 mt-4" 
        disabled={status === 'sending'}
      >
        {status === 'sending' ? tSubmitting : <>{tSubmit} <ArrowRight className="h-4 w-4"/></>}
      </button>

      <div className="mt-8 pt-6 border-t border-[color:var(--color-border)] text-center">
        <p className="text-sm font-light text-[color:var(--color-text)]/70 mb-3">{tHasAccount}</p>
        <Link href={loginHref} className="inline-flex items-center justify-center w-full rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-brand-blue transition hover:bg-[color:var(--color-surface-2)] shadow-sm">
          {tLogin}
        </Link>
      </div>

      <div className="flex flex-wrap justify-center gap-4 text-xs font-light text-[color:var(--color-text-muted)] mt-4">
        <Link href="/privacy" className="hover:text-brand-blue transition-colors">Privacidad</Link>
        <span>•</span>
        <Link href="/terms" className="hover:text-brand-blue transition-colors">Términos de uso</Link>
      </div>
    </form>
  );
}