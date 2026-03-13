// src/app/admin/deals/[id]/page.tsx
import 'server-only';

import Link from 'next/link';
import type { Metadata } from 'next';
import { AdminDealDetailClient } from './AdminDealDetailClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin · Deal | KCE',
  robots: { index: false, follow: false },
};

export default async function AdminDealDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <main className="space-y-5">
      <section className="rounded-3xl border border-black/10 bg-black/5 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/65">
              Deal · Cierre asistido
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--color-text)]">
              Cabina de cierre del deal
            </h1>
            <p className="mt-2 text-sm text-[color:var(--color-text)]/70">
              Usa este detalle para decidir la siguiente mejor acción, ejecutar el movimiento y
              volver a confirmar el impacto en outbound, templates, sequences y revenue.
            </p>
            <p className="mt-2 text-xs text-[color:var(--color-text)]/55">ID activo: {id}</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <Link className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5" href="/admin/deals">Deals</Link>
            <Link className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5" href="/admin/outbound">Outbound</Link>
            <Link className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5" href="/admin/templates">Templates</Link>
            <Link className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5" href="/admin/sequences">Sequences</Link>
            <Link className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5" href="/admin/revenue">Revenue</Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Proposal</div><p className="mt-2 text-sm text-[color:var(--color-text)]/75">Si el deal está en qualified o proposal, primero aclara oferta y fecha antes de empujar checkout.</p></div>
          <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Mensaje</div><p className="mt-2 text-sm text-[color:var(--color-text)]/75">Alinea template y secuencia con la etapa exacta: proposal, checkout o recovery.</p></div>
          <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Follow-up</div><p className="mt-2 text-sm text-[color:var(--color-text)]/75">Si no responde, vuelve a outbound con un siguiente paso claro y medible.</p></div>
          <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Validación</div><p className="mt-2 text-sm text-[color:var(--color-text)]/75">Después de moverlo, confirma en revenue si mejora reply rate, paid rate o presión en checkout.</p></div>
        </div>

        <div className="mt-4 rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4 text-sm text-[color:var(--color-text)]/72">
          Checklist diario: define si este deal necesita proposal, checkout, recovery o cierre. Ejecuta una sola acción fuerte y valida luego en revenue si realmente mejoró la señal.
        </div>
      </section>

      
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Presión</div><p className="mt-2 text-sm text-[color:var(--color-text)]/75">Define si hoy el deal exige proposal, checkout o una reactivación disciplinada.</p></div>
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Mensaje</div><p className="mt-2 text-sm text-[color:var(--color-text)]/75">El mensaje debe corresponder a la etapa exacta; evita mezclar objetivos en un mismo toque.</p></div>
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Siguiente jugada</div><p className="mt-2 text-sm text-[color:var(--color-text)]/75">Una sola jugada fuerte: propuesta mejor, empuje a checkout o recovery con hipótesis nueva.</p></div>
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Revalidación</div><p className="mt-2 text-sm text-[color:var(--color-text)]/75">Después del movimiento, vuelve a revenue y outbound para confirmar si la señal mejoró.</p></div>
      </div>
      <AdminDealDetailClient id={id} />
    </main>
  );
}
