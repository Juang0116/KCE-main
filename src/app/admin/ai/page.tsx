import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminAiLabClient } from './AdminAiLabClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'IA Lab | Admin KCE',
  robots: { index: false, follow: false },
};

export default async function AdminAiPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader title="IA Lab" description="Configuración, pruebas y playbook de agentes IA." breadcrumbs={[{ label: 'IA Lab' }]} />
      <AdminAiLabClient />
    </div>
  );
}
