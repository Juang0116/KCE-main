'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/browser';

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

export default function LoginForm({ locale }: { locale: 'es' | 'en' | 'fr' | 'de' }) {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const tEmail   = locale === 'en' ? 'Email' : locale === 'fr' ? 'Email' : locale === 'de' ? 'E-Mail' : 'Correo electrónico';
  const tPass    = locale === 'en' ? 'Password' : locale === 'fr' ? 'Mot de passe' : locale === 'de' ? 'Passwort' : 'Contraseña';
  const tForgot  = locale === 'en' ? 'Forgot password?' : locale === 'fr' ? 'Mot de passe oublié ?' : locale === 'de' ? 'Passwort vergessen?' : '¿Olvidaste tu contraseña?';
  const tSubmit  = locale === 'en' ? 'Sign in' : locale === 'fr' ? 'Se connecter' : locale === 'de' ? 'Anmelden' : 'Iniciar sesión';
  const tNoAcct  = locale === 'en' ? "Don't have an account?" : locale === 'fr' ? "Pas encore de compte ?" : locale === 'de' ? "Noch kein Konto?" : '¿No tienes cuenta?';
  const tRegister = locale === 'en' ? 'Create one' : locale === 'fr' ? 'Créer un compte' : locale === 'de' ? 'Erstellen' : 'Crear una';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');

    try {
      const supabase = supabaseBrowser();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) throw new Error(authError.message);

      router.push(withLocale(locale, '/account'));
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-500/20 shadow-sm flex items-center gap-3">
          <Lock className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] ml-1">{tEmail}</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[color:var(--color-text-muted)]">
            <Mail className="h-5 w-5" />
          </div>
          <input
            type="email"
            required
            autoComplete="username"
            placeholder="viajero@email.com"
            className="w-full rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] pl-11 pr-4 py-3.5 text-sm outline-none focus:border-brand-blue transition-all placeholder:text-[color:var(--color-text-muted)] text-[color:var(--color-text)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between ml-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)]">{tPass}</label>
          <Link href={withLocale(locale, '/forgot-password')} className="text-[10px] font-bold uppercase tracking-widest text-brand-blue hover:underline">
            {tForgot}
          </Link>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[color:var(--color-text-muted)]">
            <Lock className="h-5 w-5" />
          </div>
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] pl-11 pr-4 py-3.5 text-sm outline-none focus:border-brand-blue transition-all text-[color:var(--color-text)]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-brand-blue py-3.5 text-sm font-bold text-white transition hover:bg-brand-blue/90 disabled:opacity-50"
      >
        {loading ? '...' : tSubmit}
      </button>

      <p className="text-center text-xs text-[color:var(--color-text-muted)]">
        {tNoAcct}{' '}
        <Link href={withLocale(locale, '/register')} className="text-brand-blue font-semibold hover:underline">
          {tRegister}
        </Link>
      </p>
    </form>
  );
}
