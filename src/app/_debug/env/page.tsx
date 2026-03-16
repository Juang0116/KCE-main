import 'server-only';

import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';
import { Terminal, Lock, ShieldAlert, Code2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Debug Env — KCE',
  robots: { index: false, follow: false },
};

function isDebugEnabled() {
  // ✅ doble gate: entorno + flag explícito
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.DEBUG_ROUTES_ENABLED === 'true';
}

export default function DebugEnv() {
  noStore();

  if (!isDebugEnabled()) notFound();

  const payload = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || null,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_present: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-6 py-12 md:py-20">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2 text-rose-600">
            <Terminal className="h-6 w-6" />
            <h1 className="font-heading text-3xl md:text-4xl">Entorno de Debug (Local)</h1>
          </div>
          <p className="mt-2 text-sm text-[var(--color-text)]/60 font-light">
            Variables de entorno activas cargadas en el servidor para <code className="bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded-md border border-[var(--color-border)] font-mono text-[10px]">process.env</code>
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-rose-700 shadow-sm shrink-0">
          <ShieldAlert className="h-3 w-3" /> Modo Seguro
        </div>
      </div>

      <div className="rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 shadow-sm">
        
        {/* Banner de Seguridad */}
        <div className="mb-8 flex items-start gap-4 rounded-3xl border border-brand-blue/20 bg-brand-blue/5 p-5 shadow-sm">
          <Lock className="h-5 w-5 text-brand-blue shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-brand-blue mb-1">Capa de Seguridad Verificada</div>
            <div className="text-xs font-light text-[var(--color-text)]/70 leading-relaxed">
              Esta ruta está protegida por un doble gate. Solo es visible cuando <code className="font-mono bg-white/60 dark:bg-black/20 border border-[var(--color-border)] px-1.5 py-0.5 rounded text-[10px]">NODE_ENV !== &apos;production&apos;</code> y el flag explícito <code className="font-mono bg-white/60 dark:bg-black/20 border border-[var(--color-border)] px-1.5 py-0.5 rounded text-[10px]">DEBUG_ROUTES_ENABLED=true</code> está activo.
            </div>
          </div>
        </div>

        {/* Terminal de Payload */}
        <div className="rounded-3xl border border-[var(--color-border)] bg-gray-900 shadow-inner overflow-hidden relative">
          <div className="w-full h-12 bg-black/40 border-b border-white/10 flex items-center px-5 gap-2">
            <div className="h-3 w-3 rounded-full bg-rose-500 shadow-sm"></div>
            <div className="h-3 w-3 rounded-full bg-amber-500 shadow-sm"></div>
            <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm"></div>
            <div className="ml-4 text-[10px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-1.5">
              <Code2 className="h-3 w-3"/> env.local payload
            </div>
          </div>
          <div className="p-6 md:p-8">
            <pre className="overflow-auto text-xs md:text-sm font-mono text-emerald-400 leading-relaxed custom-scrollbar">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </div>

      </div>
    </main>
  );
}