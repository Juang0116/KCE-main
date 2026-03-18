'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { ArrowRight, Lock, Mail } from 'lucide-react';

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

export default function LoginForm({ locale }: { locale: 'es' | 'en' | 'fr' | 'de' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const nextUrl = searchParams.get('next') || withLocale(locale, '/account');

  const tEmail = locale === 'en' ? 'Email' : locale === 'fr' ? 'E-mail' : locale === 'de' ? 'E-Mail' : 'Correo electrónico';
  const tPass = locale === 'en' ? 'Password' : locale === 'fr' ? 'Mot de passe' : locale === 'de' ? 'Passwort' : 'Contraseña';
  const tSubmit = locale === 'en' ? 'Sign in' : locale === 'fr' ? 'Se connecter' : locale === 'de' ? 'Anmelden' : 'Acceder a mi cuenta';
  const tSubmitting = locale === 'en' ? 'Signing in...' : locale === 'fr' ? 'Connexion...' : locale === 'de' ? 'Anmeldung...' : 'Autenticando...';
  const tForgot = locale === 'en' ? 'Forgot password?' : locale === 'fr' ? 'Mot de passe oublié ?' : locale === 'de' ? 'Passwort vergessen?' : '¿Olvidaste tu contraseña?';
  const tNoAccount = locale === 'en' ? "Don't have an account?" : locale === 'fr' ? "Vous n'avez pas de compte ?" : locale === 'de' ? 'Kein Konto?' : '¿Aún no tienes cuenta?';
  const tRegister = locale === 'en' ? 'Create account' : locale === 'fr' ? 'Créer un compte' : locale === 'de' ? 'Konto erstellen' : 'Crear cuenta ahora';

  const registerHref = withLocale(locale, '/register') + (searchParams.toString() ? `?${searchParams.toString()}` : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Credenciales incorrectas');
      }

      router.push(nextUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-500/20 shadow-sm flex items-center gap-3">
          <Lock className="h-4 w-4 shrink-0"/> {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50 ml-1">{tEmail}</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[var(--color-text)]/30">
            <Mail className="h-5 w-5" />
          </div>
          <input
            type="email"
            required
            autoComplete="username"
            placeholder="viajero@email.com"
            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] pl-11 pr-4 py-3.5 text-sm outline-none focus:border-brand-blue focus:bg-[var(--color-surface)] transition-all placeholder:font-light"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between ml-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/50">{tPass}</label>
          <Link
            href={withLocale(locale, '/forgot-password')}
            className="text-[10px] font-bold uppercase tracking-widest text-brand-blue hover:text-brand-dark transition-colors"
          >
            {tForgot}
          </Link>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[var(--color-text)]/30">
            <Lock className="h-5 w-5" />
          </div>
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] pl-11 pr-4 py-3.5 text-sm outline-none focus:border-brand-blue focus:bg-[var(--color-surface)] transition-all placeholder:font-light"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <button 
        type="submit" 
        className="w-full flex items-center justify-center gap-2 rounded-full bg-brand-blue px-6 py-4 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-brand-blue/90 shadow-md hover:shadow-lg disabled:opacity-50 mt-4" 
        disabled={loading}
      >
        {loading ? tSubmitting : <>{tSubmit} <ArrowRight className="h-4 w-4"/></>}
      </button>

      <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-center">
        <p className="text-sm font-light text-[var(--color-text)]/70 mb-3">{tNoAccount}</p>
        <Link href={registerHref} className="inline-flex items-center justify-center w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-brand-blue transition hover:bg-[var(--color-surface-2)] shadow-sm">
          {tRegister}
        </Link>
      </div>
    </form>
  );
}