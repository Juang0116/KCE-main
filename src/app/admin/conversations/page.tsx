// src/app/admin/conversations/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import AdminConversationsClient from './AdminConversationsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Conversaciones | Admin KCE',
  robots: { index: false, follow: false },
};

export default async function AdminConversationsPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="Conversaciones"
        description="Historial de chats con clientes."
        breadcrumbs={[{ label: 'Conversaciones' }]}
      />
      <AdminConversationsClient />
    </div>
  );
}
