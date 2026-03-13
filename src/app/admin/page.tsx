import 'server-only';

import Link from 'next/link';
import ExecutiveLaunchHQDeck from '@/components/admin/ExecutiveLaunchHQDeck';
import { AdminHomeClient } from './AdminHomeClient';

export const dynamic = 'force-dynamic';

export default function AdminHomePage() {
  return (
    <main className="space-y-6"> 
      <section className="rounded-3xl border border-black/10 bg-black/5 p-5 md:p-6"> 
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"> 
          <div className="max-w-3xl"> 
            <div className="inline-flex rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/65"> 
              Commercial Command Center
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--color-text)]">Admin</h1>
            <p className="mt-2 text-sm text-[color:var(--color-text)]/70"> 
              Centro de operación diaria para abrir el día, detectar el cuello, mover el panel correcto y cerrar el loop con validación en métricas y revenue.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs"> 
            <Link className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5" href="/admin/sales">Sales</Link>
            <Link className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5" href="/admin/deals">Deals</Link>
            <Link className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5" href="/admin/outbound">Outbound</Link>
            <Link className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5" href="/admin/metrics">Métricas</Link>
            <Link className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5" href="/admin/revenue">Revenue</Link>
            <Link className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5" href="/admin/launch-hq">Launch HQ</Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4"> 
          <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Abrir</div><p className="mt-2 text-sm text-[color:var(--color-text)]/75">Empieza revisando sales, deals calientes y presión de checkout.</p></div>
          <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Mover</div><p className="mt-2 text-sm text-[color:var(--color-text)]/75">Ejecuta una acción fuerte: propuesta, follow-up, recovery o cierre.</p></div>
          <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Confirmar</div><p className="mt-2 text-sm text-[color:var(--color-text)]/75">Vuelve a métricas y revenue para validar si el loop sí movió la señal.</p></div>
          <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Disciplina</div><p className="mt-2 text-sm text-[color:var(--color-text)]/75">Cada día debe terminar con pipeline priorizado y siguiente jugada clara.</p></div>
        </div>
      </section>

      <ExecutiveLaunchHQDeck
        compact
        title="Executive launch headquarters"
        description="Use this lane when you need one clear executive answer to what deserves more traffic, more pressure or more protection today."
      />

      <AdminHomeClient />
    </main>
  );
}
