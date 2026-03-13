// src/app/admin/deals/board/page.tsx
import { requireAdmin } from '@/lib/adminGuard';

import { AdminDealsBoardClient } from './AdminDealsBoardClient';

export const dynamic = 'force-dynamic';

export default async function AdminDealsBoardPage() {
  await requireAdmin();
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--color-text)]">
        Deals
      </h1>
      <p className="text-[color:var(--color-text)]/70 mt-2 max-w-2xl text-sm">
        Tablero Kanban para mover stage rápido y tener visibilidad del pipeline.
      </p>

      <AdminDealsBoardClient />
    </main>
  );
}
