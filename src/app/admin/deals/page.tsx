// src/app/admin/deals/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDealsClient } from './AdminDealsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pipeline de Ventas | Admin KCE',
  robots: { index: false, follow: false },
};

export default async function AdminDealsPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="Pipeline de Ventas"
        description="Deals activos y su etapa de conversión."
        breadcrumbs={[{ label: 'Pipeline de Ventas' }]}
      />
      <AdminDealsClient />
    </div>
  );
}
