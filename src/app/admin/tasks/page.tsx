import { CommercialControlDeck } from '@/components/admin/CommercialControlDeck';
import { requireAdmin } from '@/lib/adminGuard';

import { AdminTasksClient } from './AdminTasksClient';

export const dynamic = 'force-dynamic';

export default async function AdminTasksPage() {
  await requireAdmin();
  return (
    <main className="space-y-6">
      <CommercialControlDeck
        eyebrow="Execution Desk"
        title="Tasks"
        description="Tareas operativas para asegurar una ejecución impecable: confirmaciones, logística, seguimiento y soporte. Este panel es el pegamento entre pipeline, delivery y experiencia real del viajero."
        primaryHref="/admin/bookings"
        primaryLabel="Abrir bookings"
        secondaryHref="/admin/tickets"
        secondaryLabel="Abrir tickets"
      />

      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Owner visible</div>
          <p className="mt-2 text-sm text-[color:var(--color-text)]/75">Cada tarea debe tener responsable, prioridad y deadline antes de quedarse sin dueño.</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Revenue-safe</div>
          <p className="mt-2 text-sm text-[color:var(--color-text)]/75">Las tareas que protegen checkout, delivery y soporte van primero porque sostienen ingreso real.</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Travel ops</div>
          <p className="mt-2 text-sm text-[color:var(--color-text)]/75">Logística, confirmación y follow-up deben sentirse como una sola operación continua.</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Next loop</div>
          <p className="mt-2 text-sm text-[color:var(--color-text)]/75">Cuando una tarea cierra, debería abrir el siguiente paso en bookings, support o review capture.</p>
        </div>
      </section>

      <AdminTasksClient />
    </main>
  );
}
