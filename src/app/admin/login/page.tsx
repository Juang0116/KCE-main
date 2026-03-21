'use client';

import * as React from 'react';
import { Suspense } from 'react'; // Requerido para useSearchParams
import { useRouter, useSearchParams } from 'next/navigation';
import { adminFetch } from '@/lib/adminFetch.client';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Lock, User, Terminal, Sparkles, AlertCircle } from 'lucide-react';

/**
 * LoginForm:
 * El motor interno del login envuelto en Suspense.
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
      
      // Éxito: Redirección al carril administrativo
      const next = sp.get('next') || '/admin';
      router.replace(next);
      router.refresh(); // Asegura que los Server Components detecten la nueva sesión
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Credenciales inválidas o nodo fuera de línea.';
      setMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="admin_user" className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] ml-1">
          Operador
        </label>
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
          <input
            id="admin_user"
            name="admin_user"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="ID de Usuario"
            className="w-full h-14 pl-12 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-sm outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all"
            autoComplete="username"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="admin_pass" className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] ml-1">
          Clave de Encriptación
        </label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
          <input
            id="admin_pass"
            name="admin_pass"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="••••••••••••"
            className="w-full h-14 pl-12 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-sm outline-none focus:ring-4 focus:ring-brand-blue/5 transition-all"
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      {msg && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-700 animate-in zoom-in-95">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{msg}</p>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full h-14 rounded-2xl bg-brand-dark text-brand-yellow font-bold uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50"
        isLoading={loading} 
        disabled={loading || !pass || !user}
      >
        Iniciar Despliegue
      </Button>

      <div className="pt-6 border-t border-[color:var(--color-border)] text-center">
        <div className="flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text)]/50">
          <Terminal className="h-3 w-3" /> Encrypted Session Node v4.1
        </div>
      </div>
    </form>
  );
}

/**
 * AdminLoginPage:
 * Punto de control de acceso principal.
 */
export default function AdminLoginPage() {
  return (
    <main className="min-h-[90vh] flex items-center justify-center p-6 animate-in fade-in duration-1000">
      
      {/* TARJETA DE ACCESO (BÓVEDA) */}
      <section className="w-full max-w-md relative">
        {/* Efecto de resplandor sutil */}
        <div className="absolute -inset-4 bg-brand-blue/5 rounded-[4rem] blur-3xl opacity-50 pointer-events-none" />

        <div className="relative rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-10 md:p-12 shadow-2xl overflow-hidden">
          
          <header className="text-center space-y-4 mb-10">
            <div className="mx-auto h-16 w-16 rounded-[2.5rem] bg-brand-blue/5 border border-brand-blue/10 flex items-center justify-center text-brand-blue shadow-inner relative">
               <ShieldCheck className="h-8 w-8" />
               <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-brand-yellow animate-pulse" />
            </div>
            <div className="space-y-1">
              <h1 className="font-heading text-3xl text-brand-blue tracking-tight">KCE <span className="text-brand-yellow italic font-light">Vault</span></h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[color:var(--color-text)]/30">Administrative Access Required</p>
            </div>
          </header>

          {/* Cargamos el formulario con Suspense para manejar searchParams */}
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-[10px] font-bold uppercase text-brand-blue/20">Sincronizando Nodo...</div>}>
            <LoginForm />
          </Suspense>

        </div>

        <p className="mt-8 text-center text-[9px] font-bold uppercase tracking-[0.3em] text-[color:var(--color-text)]/30 max-w-[280px] mx-auto leading-relaxed">
          Operational Security Level P77. Unauthorized access is recorded in the <span className="text-brand-blue/50">audit_trail</span>.
        </p>
      </section>

      {/* DECORACIÓN AMBIENTAL */}
      <footer className="fixed bottom-8 left-0 right-0 flex justify-center opacity-10 pointer-events-none">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-blue">
          <Sparkles className="h-4 w-4" /> Knowing Cultures Enterprise
        </div>
      </footer>
      
    </main>
  );
}