// src/app/admin/qa/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import AdminQaClient from './AdminQaClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'QA & Calidad | Admin KCE',
  robots: { index: false, follow: false },
};

export default async function AdminQaPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="QA & Calidad"
        description="Pruebas y verificación del sistema."
        breadcrumbs={[{ label: 'QA & Calidad' }]}
      />
      <AdminQaClient />
    </div>
  );
}
