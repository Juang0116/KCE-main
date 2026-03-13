import 'server-only';

import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Seguridad | Admin | KCE',
  robots: { index: false, follow: false },
};

export default function AdminSecurityPage() {
  const signedMode = (process.env.SIGNED_ACTIONS_MODE || '').trim() || '(auto)';
  const rbac = (process.env.RBAC_REQUIRED || '').trim() || '0';
  const turnstile = (process.env.TURNSTILE_ENFORCE || '').trim() || '0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-brand-blue">Seguridad</h1>
        <p className="mt-2 text-sm text-[color:var(--color-text)]/70">
          Checklist operativo final (hardening, disclosure, audits, budgets).
        </p>
      </div>

      <div className="rounded-2xl border border-[color:var(--color-border)] bg-white p-6 shadow-sm dark:bg-[#0b1220]">
        <div className="text-sm font-semibold">Estado de enforcement</div>
        <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-text)]/80">
          <li>
            Signed Actions mode: <span className="font-mono">{signedMode}</span>
          </li>
          <li>
            RBAC_REQUIRED: <span className="font-mono">{rbac}</span>
          </li>
          <li>
            TURNSTILE_ENFORCE: <span className="font-mono">{turnstile}</span>
          </li>
        </ul>
      </div>

      <div className="rounded-2xl border border-[color:var(--color-border)] bg-white p-6 shadow-sm dark:bg-[#0b1220]">
        <div className="text-sm font-semibold">Divulgación</div>
        <div className="mt-3 space-y-1 text-sm">
          <a className="text-brand-blue underline" href="/security.txt" target="_blank" rel="noreferrer">
            /security.txt
          </a>
          <div className="text-[color:var(--color-text)]/70">También disponible en /.well-known/security.txt</div>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--color-border)] bg-white p-6 shadow-sm dark:bg-[#0b1220]">
        <div className="text-sm font-semibold">CI: Dependency audit</div>
        <p className="mt-2 text-sm text-[color:var(--color-text)]/70">
          CI ahora corre <span className="font-mono">npm audit --omit=dev</span> con umbral High/Critical = 0
          (ajustable por env en el workflow).
        </p>
      </div>
    </div>
  );
}
