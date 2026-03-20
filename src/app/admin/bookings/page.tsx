// src/app/admin/bookings/page.tsx
import 'server-only';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/adminGuard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminBookingsClient } from './AdminBookingsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Reservas | Admin KCE',
  robots: { index: false, follow: false },
};

export default async function AdminBookingsPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader
        title="Reservas"
        description="Bookings confirmados y su estado."
        breadcrumbs={[{ label: 'Reservas' }]}
      />
      <AdminBookingsClient />
    </div>
  );
}
