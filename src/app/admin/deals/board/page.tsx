import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminDealsBoardClient } from './AdminDealsBoardClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Pipeline Board | Admin KCE',
  robots: { index: false, follow: false },
};

export default async function AdminDealsBoardPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader title="Pipeline Kanban" description="Mueve deals entre etapas arrastrando las tarjetas." breadcrumbs={[{ label: 'Pipeline', href: '/admin/deals' }, { label: 'Tablero' }]} />
      <AdminDealsBoardClient />
    </div>
  );
}
