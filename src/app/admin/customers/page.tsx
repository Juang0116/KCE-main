// src/app/admin/customers/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminCustomersClient } from './AdminCustomersClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Clientes | Admin KCE',
  robots: { index: false, follow: false },
};

export default async function AdminCustomersPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="Clientes"
        description="Directorio completo de clientes KCE."
        breadcrumbs={[{ label: 'Clientes' }]}
      />
      <AdminCustomersClient />
    </div>
  );
}
