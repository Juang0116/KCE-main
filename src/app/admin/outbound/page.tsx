// src/app/admin/outbound/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminOutboundClient } from './AdminOutboundClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Outbound | Admin KCE',
  robots: { index: false, follow: false },
};

export default async function AdminOutboundPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="Outbound"
        description="Emails salientes y mensajes generados por IA."
        breadcrumbs={[{ label: 'Outbound' }]}
      />
      <AdminOutboundClient />
    </div>
  );
}
