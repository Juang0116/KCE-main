// src/app/admin/marketing/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminMarketingClient } from './AdminMarketingClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Marketing | Admin KCE',
  robots: { index: false, follow: false },
};

export default async function AdminMarketingPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="Marketing"
        description="Campañas, UTMs y captación."
        breadcrumbs={[{ label: 'Marketing' }]}
      />
      <AdminMarketingClient />
    </div>
  );
}
