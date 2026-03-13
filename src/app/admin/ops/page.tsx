// src/app/admin/ops/page.tsx
import { requireAdmin } from '@/lib/adminGuard';

import { AdminOpsClient } from './AdminOpsClient';

export const dynamic = 'force-dynamic';

export default async function AdminOpsPage() {
  await requireAdmin();
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--color-text)]">
        Ops
      </h1>
      <p className="text-[color:var(--color-text)]/70 mt-2 max-w-2xl text-sm">
        Vista rápida de operación: SLA, tareas vencidas, tickets y pipeline.
      </p>

      <div className="flex flex-wrap gap-2">
        <a
          href="/admin/ops/metrics"
          className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm hover:bg-black/5 dark:bg-black/30"
        >
          Métricas & SLA
        </a>
        <a
          href="/admin/ops/incidents"
          className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm hover:bg-black/5 dark:bg-black/30"
        >
          Incidentes
        </a>
        <a
          href="/admin/ops/runbooks"
          className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm hover:bg-black/5 dark:bg-black/30"
        >
          Runbooks
        </a>
      </div>

      <AdminOpsClient />
    </main>
  );
}
