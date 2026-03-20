// src/app/admin/templates/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTemplatesClient } from './AdminTemplatesClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Plantillas Email | Admin KCE',
  robots: { index: false, follow: false },
};

export default async function AdminTemplatesPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="Plantillas Email"
        description="Mensajes predefinidos para agentes."
        breadcrumbs={[{ label: 'Plantillas Email' }]}
      />
      <AdminTemplatesClient />
    </div>
  );
}
