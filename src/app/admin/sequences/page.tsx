// src/app/admin/sequences/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSequencesClient } from './AdminSequencesClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Secuencias Drip | Admin KCE',
  robots: { index: false, follow: false },
};

export default async function AdminSequencesPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="Secuencias Drip"
        description="Emails automáticos de seguimiento."
        breadcrumbs={[{ label: 'Secuencias Drip' }]}
      />
      <AdminSequencesClient />
    </div>
  );
}
