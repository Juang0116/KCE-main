/* src/app/_debug/env/page.tsx */
import 'server-only';

import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import type { Metadata } from 'next';

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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft">
        <h1 className="text-lg font-semibold text-[color:var(--color-text)]">Debug Env</h1>
        <p className="mt-1 text-sm text-[color:var(--color-text)]/60">
          Visible solo en desarrollo y cuando <code className="font-mono">DEBUG_ROUTES_ENABLED=true</code>.
        </p>

        <pre className="mt-4 overflow-auto rounded-xl bg-[color:var(--color-surface-2)] p-4 text-xs text-[color:var(--color-text)]/80">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </div>
    </div>
  );
}
