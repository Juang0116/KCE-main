// src/app/admin/ops/metrics/page.tsx
import { requireAdmin } from '@/lib/adminGuard';

import { AdminOpsMetricsClient } from './AdminOpsMetricsClient';

export const dynamic = 'force-dynamic';

export default async function AdminOpsMetricsPage() {
  await requireAdmin();
  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--color-text)]">
          Ops Metrics
        </h1>
        <p className="text-[color:var(--color-text)]/70 mt-2 max-w-2xl text-sm">
          KPI rápidos: volumen de incidentes, SLA de ack/resolve, top causas y pausas activas.
        </p>
      </div>

      <AdminOpsMetricsClient />
    </main>
  );
}
