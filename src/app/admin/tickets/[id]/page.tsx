// src/app/admin/tickets/[id]/page.tsx
import 'server-only';

import { AdminTicketClient } from './AdminTicketClient';

import type { Metadata } from 'next';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ticket | Admin | KCE',
  robots: { index: false, follow: false },
};

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="space-y-6">
      <h1 className="font-heading text-2xl text-brand-blue">Ticket</h1>
      <p className="text-[color:var(--color-text)]/70 mt-2 text-sm">
        Detalle y respuesta (se guarda como mensaje role=agent en la conversación).
      </p>
      <AdminTicketClient id={id} />
    </main>
  );
}
