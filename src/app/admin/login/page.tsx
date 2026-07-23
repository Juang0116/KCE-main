'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminFetch } from '@/lib/adminFetch.client';
import { Button } from '@/components/ui/Button';
import {
  ShieldCheck,
  Lock,
  User,
  Terminal,
  Sparkles,
  AlertTriangle,
  Hash,
  Zap,
  Fingerprint,
  RefreshCw, // <--- Añade esta línea aquí
} from 'lucide-react';

/**
 * LoginForm:
 * El motor interno del login envuelto en Suspense para telemetría de redirección.
 */
function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();

  const [user, setUser] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string>('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setLoading(true);

    try {
      const res = await adminFetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      });

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(j?.error || `Acceso denegado: Nodo ${res.status}`);
      }

      // Éxito: Redirección al carril administrativo (Launch HQ)
      const next = sp.get('next') || '/admin';
      router.replace(next);
      router.refresh();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Credenciales inválidas o nodo fuera de línea.';
      setMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6"
    >
      <div className="space-y-3">
        <label
          htmlFor="admin_user"
          className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60"
        >
          Operator ID
        </label>
        <div className="group relative">
          <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-blue opacity-30 transition-opacity group-focus-within:opacity-100" />
          <input
            id="admin_user"
            name="admin_user"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="Identificador del Nodo"
            className="bg-surface-2/50 placeholder:text-muted/30 h-14 w-full rounded-2xl border border-brand-dark/10 pl-12 pr-6 text-sm text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
            autoComplete="username"
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <label
          htmlFor="admin_pass"
          className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted opacity-60"
        >
          Encryption Key
        </label>
        <div className="group relative">
          <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-blue opacity-30 transition-opacity group-focus-within:opacity-100" />
          <input
            id="admin_pass"
            name="admin_pass"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="••••••••••••"
            className="bg-surface-2/50 placeholder:text-muted/30 h-14 w-full rounded-2xl border border-brand-dark/10 pl-12 pr-6 font-mono text-sm text-main shadow-inner outline-none transition-all focus:ring-4 focus:ring-brand-blue/10 dark:border-white/10"
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      {msg && (
        <div className="animate-in slide-in-from-top-2 flex items-start gap-4 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 p-5 text-xs font-bold text-red-700 shadow-sm dark:bg-red-950/10 dark:text-red-400">
          <AlertTriangle className="h-5 w-5 shrink-0 opacity-60" />
          <p className="leading-relaxed">{msg}</p>
        </div>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          className="group/btn relative h-16 w-full overflow-hidden rounded-[2rem] bg-brand-dark text-xs font-bold uppercase tracking-[0.2em] text-brand-yellow shadow-pop transition-all hover:bg-brand-blue hover:text-white active:scale-95 disabled:opacity-50"
          isLoading={loading}
          disabled={loading || !pass || !user}
        >
          <div className="relative z-10 flex items-center justify-center gap-3">
            <Zap className="h-4 w-4 fill-current" />
            Iniciar Despliegue
          </div>
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 group-hover/btn:translate-x-full" />
        </Button>
      </div>

      <div className="border-t border-brand-dark/5 pt-8 dark:border-white/5">
        <div className="flex items-center justify-center gap-4 font-mono text-[9px] font-bold uppercase tracking-[0.4em] text-muted opacity-40">
          <Terminal className="h-3.5 w-3.5" /> SECURE_SESSION_NODE_v5.2
        </div>
      </div>
    </form>
  );
}

/**
 * AdminLoginPage:
 * Punto de control de acceso principal (The Vault).
 */
export default function AdminLoginPage() {
  return (
    <main className="animate-in fade-in bg-surface-2/10 flex min-h-[95vh] items-center justify-center p-6 duration-1000">
      {/* TARJETA DE ACCESO (LA BÓVEDA) */}
      <section className="relative w-full max-w-md">
        {/* Efecto de resplandor ambiental */}
        <div className="pointer-events-none absolute -inset-10 rounded-full bg-brand-blue/5 opacity-40 blur-[80px]" />

        <div className="relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-pop dark:border-white/5 md:p-14">
          <header className="mb-12 space-y-6 text-center">
            <div className="group relative mx-auto flex h-20 w-20 items-center justify-center rounded-[2.5rem] border border-brand-blue/5 bg-brand-blue/10 text-brand-blue shadow-inner">
              <Fingerprint className="h-10 w-10 opacity-60 transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute -right-1 -top-1 h-4 w-4 animate-pulse rounded-full bg-brand-yellow shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
            </div>
            <div className="space-y-2">
              <h1 className="font-heading text-4xl leading-none tracking-tight text-main">
                KCE <span className="font-light italic text-brand-yellow">Vault</span>
              </h1>
              <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40">
                <ShieldCheck className="h-3 w-3" /> Identity Verification System
              </div>
            </div>
          </header>

          {/* Formulario con Suspense para telemetría de búsqueda */}
          <Suspense
            fallback={
              <div className="flex h-80 flex-col items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue opacity-20">
                <RefreshCw className="h-8 w-8 animate-spin" />
                Sincronizando Nodo...
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        <div className="mt-10 space-y-4 text-center">
          <p className="mx-auto max-w-[320px] text-[9px] font-bold uppercase leading-relaxed tracking-[0.3em] text-muted opacity-30">
            Operational Security Level P77. Unauthorized access is recorded in the{' '}
            <span className="font-mono text-brand-blue">audit_trail_01</span>.
          </p>
          <div className="flex items-center justify-center gap-4 opacity-10">
            <Hash className="h-3 w-3" />
            <div className="h-px w-8 bg-current" />
            <Sparkles className="h-3 w-3" />
            <div className="h-px w-8 bg-current" />
            <Zap className="h-3 w-3" />
          </div>
        </div>
      </section>

      {/* FOOTER DE INTEGRIDAD CORPORATIVA */}
      <footer className="pointer-events-none fixed bottom-10 left-0 right-0 flex justify-center opacity-20">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.6em] text-brand-blue">
          <ShieldCheck className="h-4 w-4" /> Knowing Cultures S.A.S.
        </div>
      </footer>
    </main>
  );
}
