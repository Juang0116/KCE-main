// src/app/admin/tasks/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTasksClient } from './AdminTasksClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Tareas | Admin KCE',
  robots: { index: false, follow: false },
};

export default async function AdminTasksPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="Tareas"
        description="Pendientes y compromisos del equipo."
        breadcrumbs={[{ label: 'Tareas' }]}
      />
      <AdminTasksClient />
    </div>
  );
}
