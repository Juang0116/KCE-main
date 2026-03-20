import 'server-only';

import type { Metadata } from 'next';

import AdminSystemStatusClient from './AdminSystemStatusClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sistema | Admin | KCE',
  robots: { index: false, follow: false },
};

export default function AdminSystemPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-heading text-2xl text-brand-blue">Sistema</h1>
      <p className="mt-2 text-sm text-[color:var(--color-text)]/70">
        Health checks operativos (env, Supabase, colas, pagos recientes). Úsalo como gate antes de
        tocar producción.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <a className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-sm dark:bg-[var(--brand-dark)]" href="/admin/system/security">
          <div className="text-sm font-semibold">Seguridad</div>
          <div className="mt-1 text-xs text-[color:var(--color-text)]/70">Enforcement, disclosure, CI audits</div>
        </a>
        <a className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-sm dark:bg-[var(--brand-dark)]" href="/admin/system/dr">
          <div className="text-sm font-semibold">DR</div>
          <div className="mt-1 text-xs text-[color:var(--color-text)]/70">Simulacros + frescura de backups</div>
        </a>
        <a className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-sm dark:bg-[var(--brand-dark)]" href="/admin/system/backups">
          <div className="text-sm font-semibold">Backups</div>
          <div className="mt-1 text-xs text-[color:var(--color-text)]/70">Bitácora de backups</div>
        </a>
        <a className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-sm dark:bg-[var(--brand-dark)]" href="/admin/analytics">
          <div className="text-sm font-semibold">Analytics</div>
          <div className="mt-1 text-xs text-[color:var(--color-text)]/70">CAC/LTV + performance budgets</div>
        </a>
      </div>

      <div className="mt-6">
        <AdminSystemStatusClient />
      </div>

      <div className="mt-8 rounded-2xl border border-black/10 p-4 text-sm dark:border-white/10">
        <div className="font-semibold">Release gates (P71)</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[color:var(--color-text)]/80">
          <li>
            Local: <code className="rounded bg-black/5 px-1 py-0.5">npm run qa:p71</code>
          </li>
          <li>
            Remote: <code className="rounded bg-black/5 px-1 py-0.5">BASE_URL=... npm run qa:p71</code>
          </li>
          <li>
            Docs: <code className="rounded bg-black/5 px-1 py-0.5">docs/RELEASE_GATES_P71.md</code>
          </li>
        </ul>
      </div>
    </main>
  );
}
