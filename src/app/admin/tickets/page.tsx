// src/app/admin/tickets/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTicketsClient } from './AdminTicketsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tickets de Soporte | Admin KCE',
  robots: { index: false, follow: false },
};

export default async function AdminTicketsPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="Tickets de Soporte"
        description="Solicitudes de clientes abiertas."
        breadcrumbs={[{ label: 'Tickets de Soporte' }]}
      />
      <AdminTicketsClient />
    </div>
  );
}
