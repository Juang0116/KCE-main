// src/app/admin/metrics/page.tsx
import 'server-only';

import Link from 'next/link';
import { AdminMetricsClient } from './AdminMetricsClient';

import type { Metadata } from 'next';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin · Métricas | KCE',
  robots: { index: false, follow: false },
};

export default function AdminMetricsPage() {
  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-black/10 bg-black/5 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/65">
              Metrics → Action
            </div>
            <h1 className="mt-3 font-heading text-2xl text-brand-blue">Métricas</h1>
            <p className="mt-2 text-sm text-[color:var(--color-text)]/70">
              Funnel comercial y señales de Revenue Ops para detectar dónde acelerar, dónde insistir y
              qué campañas se están enfriando. Úsalo como panel de detección antes de ejecutar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5" href="/admin/sales">Sales</Link>
            <Link className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5" href="/admin/deals">Deals</Link>
            <Link className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5" href="/admin/outbound">Outbound</Link>
            <Link className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-3 py-1.5 hover:bg-black/5" href="/admin/revenue">Revenue</Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Detectar</div><p className="mt-2 text-sm text-[color:var(--color-text)]/75">Encuentra la fuga: start, proposal, checkout, reply o paid.</p></div>
          <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Ejecutar</div><p className="mt-2 text-sm text-[color:var(--color-text)]/75">Abre el panel correcto y mueve deals, mensajes, secuencias o cadencia.</p></div>
          <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Confirmar</div><p className="mt-2 text-sm text-[color:var(--color-text)]/75">Regresa aquí para validar si la señal mejora después del ajuste.</p></div>
        </div>
      </section>


      <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4 text-sm text-[color:var(--color-text)]/72">
        Ritmo recomendado: abre aquí, detecta la fuga, ejecuta en el panel correcto y vuelve a confirmar. Si el loop no cambia la señal, el problema está en el mensaje, la cadencia o la oferta.
      </div>
      
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Señal líder</div><p className="mt-2 text-sm text-[color:var(--color-text)]/75">Identifica una sola señal crítica antes de abrir más paneles.</p></div>
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Hipótesis</div><p className="mt-2 text-sm text-[color:var(--color-text)]/75">Si la señal cae, decide si el problema es mensaje, timing, oferta o fricción.</p></div>
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Acción</div><p className="mt-2 text-sm text-[color:var(--color-text)]/75">Mueve un panel, una acción y una franja del funnel; evita cambios difusos.</p></div>
        <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4"><div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/55">Confirmación</div><p className="mt-2 text-sm text-[color:var(--color-text)]/75">Vuelve y comprueba si el ajuste movió reply, checkout o paid.</p></div>
      </div>
      <AdminMetricsClient />
    </main>
  );
}
