import 'server-only';

import type { Metadata } from 'next';

import AdminExecutivePanel from '@/components/admin/AdminExecutivePanel';
import AdminOperatorWorkbench from '@/components/admin/AdminOperatorWorkbench';

import AdminQaClient from './AdminQaClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'QA | Admin | KCE',
  robots: { index: false, follow: false },
};

export default function AdminQaPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <AdminExecutivePanel
        eyebrow="release gate"
        title="QA final y revenue truth para cerrar KCE con más confianza operativa"
        description="Esta vista ya no necesita más decks repetidos. Lo importante aquí es leer rápido si KCE puede cobrar, persistir, entregar la reserva y recuperarse cuando algo no salga perfecto."
        quickLinks={[
          { href: '/admin/command-center', label: 'Command center' },
          { href: '/admin/launch-hq', label: 'Launch HQ' },
          { href: '/admin/revenue', label: 'Revenue', tone: 'primary' },
          { href: '/admin/bookings', label: 'Bookings' },
        ]}
        focusItems={[
          {
            label: 'qa base',
            title: 'Build, smoke y preflight',
            body: 'Antes de publicar o empujar ventas, confirma build limpio, smoke estable y QA profundo donde de verdad importe.',
            href: '/admin/qa',
            cta: 'Correr QA',
          },
          {
            label: 'revenue e2e',
            title: 'Cobrar, persistir y entregar',
            body: 'El punto crítico es el flujo continuo: Stripe, webhook, booking, links firmados, invoice y email sin huecos.',
            href: '/admin/revenue',
            cta: 'Ver revenue',
          },
          {
            label: 'recovery',
            title: 'Recuperación calmada',
            body: 'Si algo falla, RC Verify, heal booking/email y la revisión manual deben dejar al operador con una salida clara.',
            href: '/admin/ops/runbooks',
            cta: 'Ver runbooks',
          },
        ]}
        notes={[
          {
            title: 'Menos ruido',
            body: 'La página ahora arranca con lectura ejecutiva antes de bajar al detalle técnico del cliente QA.',
          },
          {
            title: 'Launch decision',
            body: 'La pregunta real ya no es si compila, sino si la operación aguanta más tráfico sin romper la promesa premium.',
          },
          {
            title: 'Zona final',
            body: 'Aquí se valida el último tramo entre MVP fuerte y cierre mucho más 10/10.',
          },
        ]}
      />

      <div className="mt-8">
        <AdminOperatorWorkbench
          eyebrow="operator workbench"
          title="Qué revisar hoy antes de mover tráfico o campañas"
          description="La secuencia buena es simple: build y smoke, QA profundo, compra de prueba real, RC Verify, revisión manual en booking/account/admin y solo después empujar distribución."
          actions={[
            { href: '/admin/revenue', label: 'Revenue desk', tone: 'primary' },
            { href: '/admin/bookings', label: 'Bookings' },
            { href: '/admin/system', label: 'System' },
            { href: '/admin/ops/runbooks', label: 'Runbooks' },
          ]}
          signals={[
            {
              label: 'build lane',
              value: 'CI + smoke',
              note: 'El release sigue apoyándose en build limpio, qa:ci y qa:smoke como verdad de base.',
            },
            {
              label: 'revenue lane',
              value: 'RC Verify',
              note: 'Valida session_id real, webhook, booking, links firmados y email antes de escalar.',
            },
            {
              label: 'traveler lane',
              value: 'Booking/account',
              note: 'La revisión manual final debe abrir booking, invoice y cuenta sin fricción rara.',
            },
            {
              label: 'launch decision',
              value: 'Go / no-go',
              note: 'Esta vista ahora empuja una lectura más ejecutiva para decidir si KCE puede vender más hoy.',
            },
          ]}
        />
      </div>

      <div className="mt-8">
        <AdminQaClient />
      </div>

      <section className="mt-8 rounded-3xl border border-black/10 bg-white/80 p-5 shadow-soft dark:border-white/10 dark:bg-black/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]/45">release candidate checklist</div>
            <h2 className="mt-2 font-heading text-xl text-brand-blue">Qué tiene que quedar en verde antes de mover más presión comercial</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/72">Esta capa final ya no es de features nuevas. Es de verificar que KCE puede vender, entregar, soportar y recuperarse sin romper la promesa premium.</p>
          </div>
          <a href="/admin/runbook" className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm font-medium text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface)]">Abrir runbook</a>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ['Front premium', 'Home, tours, detail, plan y contacto revisados en mobile y desktop.'],
            ['Revenue truth', 'Stripe, webhook, booking, invoice y email validados sobre compra real.'],
            ['Continuity truth', 'Chat, contacto y CRM conservan el contexto sin reiniciar el caso.'],
            ['Recovery truth', 'Bookings, tickets y runbooks dejan una salida clara cuando algo falla.'],
          ].map(([title, copy]) => (
            <article key={title} className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
