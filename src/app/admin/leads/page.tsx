// src/app/admin/leads/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminLeadsClient } from './AdminLeadsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Leads | Admin KCE',
  robots: { index: false, follow: false },
};

export default async function AdminLeadsPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="Leads"
        description="Prospectos entrantes — califica y mueve al pipeline."
        breadcrumbs={[{ label: 'Leads' }]}
      />
      <AdminLeadsClient />
    </div>
  );
}
