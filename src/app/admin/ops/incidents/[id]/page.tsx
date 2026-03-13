// src/app/admin/ops/incidents/[id]/page.tsx
import 'server-only';

import type { Metadata } from 'next';
import Link from 'next/link';

import { requireAdmin } from '@/lib/adminGuard';
import { AdminIncidentDetailClient } from './AdminIncidentDetailClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin · Incident Detail | KCE',
  robots: { index: false, follow: false },
};

export default async function AdminIncidentDetailPage(props: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await props.params;
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-brand-blue">Incidente</h1>
          <p className="mt-1 text-sm text-[color:var(--color-text)]/70">
            Detalle + timeline + postmortem.
          </p>
        </div>
        <Link className="text-sm underline text-[color:var(--color-text)]/70 hover:text-[color:var(--color-text)]" href="/admin/ops/incidents">
          ← Volver
        </Link>
      </div>

      <AdminIncidentDetailClient id={id} />
    </main>
  );
}
