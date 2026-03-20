// src/app/admin/sales/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSalesCockpitClient } from './AdminSalesCockpitClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sales Cockpit | Admin KCE',
  robots: { index: false, follow: false },
};

export default async function AdminSalesPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="Sales Cockpit"
        description="Vista comercial consolidada."
        breadcrumbs={[{ label: 'Sales Cockpit' }]}
      />
      <AdminSalesCockpitClient />
    </div>
  );
}
