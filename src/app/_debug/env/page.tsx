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
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-3 text-rose-600">
            <Terminal className="h-6 w-6" />
            <h1 className="font-heading text-3xl md:text-4xl">Entorno de Debug (Local)</h1>
          </div>
          <p className="text-[color:var(--color-text)]/60 mt-2 text-sm font-light">
            Variables de entorno activas cargadas en el servidor para{' '}
            <code className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-1.5 py-0.5 font-mono text-[10px]">
              process.env
            </code>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-rose-700 shadow-sm">
          <ShieldAlert className="h-3 w-3" /> Modo Seguro
        </div>
      </div>

      <div className="rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-sm md:p-8">
        {/* Banner de Seguridad */}
        <div className="mb-8 flex items-start gap-4 rounded-3xl border border-brand-blue/20 bg-brand-blue/5 p-5 shadow-sm">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
          <div>
            <div className="mb-1 text-sm font-bold text-brand-blue">
              Capa de Seguridad Verificada
            </div>
            <div className="text-[color:var(--color-text)]/70 text-xs font-light leading-relaxed">
              Esta ruta está protegida por un doble gate. Solo es visible cuando{' '}
              <code className="rounded border border-[color:var(--color-border)] bg-white/60 px-1.5 py-0.5 font-mono text-[10px] dark:bg-black/20">
                NODE_ENV !== &apos;production&apos;
              </code>{' '}
              y el flag explícito{' '}
              <code className="rounded border border-[color:var(--color-border)] bg-white/60 px-1.5 py-0.5 font-mono text-[10px] dark:bg-black/20">
                DEBUG_ROUTES_ENABLED=true
              </code>{' '}
              está activo.
            </div>
          </div>
        </div>

        {/* Terminal de Payload */}
        <div className="relative overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-gray-900 shadow-inner">
          <div className="flex h-12 w-full items-center gap-2 border-b border-white/10 bg-black/40 px-5">
            <div className="h-3 w-3 rounded-full bg-rose-500 shadow-sm"></div>
            <div className="h-3 w-3 rounded-full bg-amber-500 shadow-sm"></div>
            <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm"></div>
            <div className="ml-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white/40">
              <Code2 className="h-3 w-3" /> env.local payload
            </div>
          </div>
          <div className="p-6 md:p-8">
            <pre className="custom-scrollbar overflow-auto font-mono text-xs leading-relaxed text-emerald-400 md:text-sm">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}
