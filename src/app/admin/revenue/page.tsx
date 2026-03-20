// src/app/admin/revenue/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminRevenueOpsClient } from './AdminRevenueOpsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Revenue | Admin KCE',
  robots: { index: false, follow: false },
};

export default async function AdminRevenuePage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="Revenue"
        description="Ingresos, pagos y proyecciones."
        breadcrumbs={[{ label: 'Revenue' }]}
      />
      <AdminRevenueOpsClient />
    </div>
  );
}
