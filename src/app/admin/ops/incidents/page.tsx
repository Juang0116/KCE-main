// src/app/admin/ops/incidents/page.tsx
import 'server-only';

import type { Metadata } from 'next';

import { AdminIncidentsClient } from './AdminIncidentsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin · Ops Incidentes | KCE',
  robots: { index: false, follow: false },
};

export default function AdminOpsIncidentsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-heading text-2xl text-brand-blue">Incidentes (Ops)</h1>
      <p className="mt-2 text-sm text-[color:var(--color-text)]/70">
        Alertas operativas auto‑deduplicadas: checkout, Stripe webhook y email. Usa este panel para reconocer
        (ack) y resolver.
      </p>
      <div className="mt-8">
        <AdminIncidentsClient />
      </div>
    </main>
  );
}
