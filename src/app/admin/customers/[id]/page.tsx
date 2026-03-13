import 'server-only';

import { AdminCustomerClient } from './AdminCustomerClient';

import type { Metadata } from 'next';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Customer 360 | Admin | KCE',
  robots: { index: false, follow: false },
};

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="space-y-6">
      <h1 className="font-heading text-2xl text-brand-blue">Customer 360</h1>
      <p className="text-[color:var(--color-text)]/70 mt-2 text-sm">
        Vista unificada: cliente + reservas + leads + conversaciones + eventos.
      </p>

      <AdminCustomerClient id={id} />
    </main>
  );
}
