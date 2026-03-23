'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminFetch } from '@/lib/adminFetch.client';
import { Button } from '@/components/ui/Button';
import { 
  ShieldCheck, Lock, User, Terminal, 
  Sparkles, AlertTriangle, Hash, Zap,
  Fingerprint, 
  RefreshCw // <--- Añade esta línea aquí
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
      const errorMessage = err instanceof Error ? err.message : 'Credenciales inválidas o nodo fuera de línea.';
      setMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-3">
        <label htmlFor="admin_user" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1 opacity-60">
          Operator ID
        </label>
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-blue opacity-30 group-focus-within:opacity-100 transition-opacity" />
          <input
            id="admin_user"
            name="admin_user"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="Identificador del Nodo"
            className="w-full h-14 pl-12 pr-6 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface-2/50 text-sm text-main outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner placeholder:text-muted/30"
            autoComplete="username"
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor="admin_pass" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted ml-1 opacity-60">
          Encryption Key
        </label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-blue opacity-30 group-focus-within:opacity-100 transition-opacity" />
          <input
            id="admin_pass"
            name="admin_pass"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="••••••••••••"
            className="w-full h-14 pl-12 pr-6 rounded-2xl border border-brand-dark/10 dark:border-white/10 bg-surface-2/50 text-sm text-main outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all shadow-inner placeholder:text-muted/30 font-mono"
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      {msg && (
        <div className="flex items-start gap-4 rounded-[var(--radius-2xl)] border border-red-500/20 bg-red-50 dark:bg-red-950/10 p-5 text-xs text-red-700 dark:text-red-400 animate-in slide-in-from-top-2 font-bold shadow-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 opacity-60" />
          <p className="leading-relaxed">{msg}</p>
        </div>
      )}

      <div className="pt-2">
        <Button 
          type="submit" 
          className="w-full h-16 rounded-[2rem] bg-brand-dark text-brand-yellow font-bold uppercase tracking-[0.2em] text-xs shadow-pop hover:bg-brand-blue hover:text-white transition-all active:scale-95 disabled:opacity-50 overflow-hidden relative group/btn"
          isLoading={loading} 
          disabled={loading || !pass || !user}
        >
          <div className="relative z-10 flex items-center justify-center gap-3">
             <Zap className="h-4 w-4 fill-current" />
             Iniciar Despliegue
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
        </Button>
      </div>

      <div className="pt-8 border-t border-brand-dark/5 dark:border-white/5">
        <div className="flex items-center justify-center gap-4 text-[9px] font-mono font-bold uppercase tracking-[0.4em] text-muted opacity-40">
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
    <main className="min-h-[95vh] flex items-center justify-center p-6 animate-in fade-in duration-1000 bg-surface-2/10">
      
      {/* TARJETA DE ACCESO (LA BÓVEDA) */}
      <section className="w-full max-w-md relative">
        {/* Efecto de resplandor ambiental */}
        <div className="absolute -inset-10 bg-brand-blue/5 rounded-full blur-[80px] opacity-40 pointer-events-none" />

        <div className="relative rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 md:p-14 shadow-pop overflow-hidden">
          
          <header className="text-center space-y-6 mb-12">
            <div className="mx-auto h-20 w-20 rounded-[2.5rem] bg-brand-blue/10 border border-brand-blue/5 flex items-center justify-center text-brand-blue shadow-inner relative group">
               <Fingerprint className="h-10 w-10 opacity-60 group-hover:scale-110 transition-transform duration-700" />
               <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-brand-yellow animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
            </div>
            <div className="space-y-2">
              <h1 className="font-heading text-4xl text-main tracking-tight leading-none">KCE <span className="text-brand-yellow italic font-light">Vault</span></h1>
              <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-muted opacity-40">
                 <ShieldCheck className="h-3 w-3" /> Identity Verification System
              </div>
            </div>
          </header>

          {/* Formulario con Suspense para telemetría de búsqueda */}
          <Suspense fallback={
            <div className="h-80 flex flex-col items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue opacity-20">
               <RefreshCw className="h-8 w-8 animate-spin" />
               Sincronizando Nodo...
            </div>
          }>
            <LoginForm />
          </Suspense>

        </div>

        <div className="mt-10 space-y-4 text-center">
           <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted opacity-30 max-w-[320px] mx-auto leading-relaxed">
             Operational Security Level P77. Unauthorized access is recorded in the <span className="text-brand-blue font-mono">audit_trail_01</span>.
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
      <footer className="fixed bottom-10 left-0 right-0 flex justify-center opacity-20 pointer-events-none">
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.6em] text-brand-blue">
          <ShieldCheck className="h-4 w-4" /> Knowing Cultures S.A.S.
        </div>
      </footer>
      
    </main>
  );
}