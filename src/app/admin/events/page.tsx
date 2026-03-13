// src/app/admin/events/page.tsx
import 'server-only';

import type { Metadata } from 'next';

import { AdminEventsClient } from './AdminEventsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin · Events | KCE',
  robots: { index: false, follow: false },
};

export default function AdminEventsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-heading text-2xl text-brand-blue">Events</h1>
      <p className="text-[color:var(--color-text)]/70 mt-2 text-sm">
        Timeline de observabilidad (checkout/webhook/email/CRM). Busca por{' '}
        <span className="font-mono">session_id</span> o <span className="font-mono">entity_id</span>
        .
      </p>

      <div className="mt-8">
        <AdminEventsClient />
      </div>
    </main>
  );
}
