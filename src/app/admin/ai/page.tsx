// src/app/admin/ai/page.tsx
import 'server-only';

import { AdminAiLabClient } from './AdminAiLabClient';
import { AiHandoffControlDeck } from '@/components/admin/AiHandoffControlDeck';

import type { Metadata } from 'next';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'IA | Admin | KCE',
  robots: { index: false, follow: false },
};

export default function AdminAiPage() {
  return (
    <main className="space-y-6">
      <h1 className="font-heading text-2xl text-brand-blue">IA (Lab)</h1>
      <p className="text-[color:var(--color-text)]/70 mt-2 text-sm">
        Panel interno para probar el endpoint <code className="font-mono">/api/ai</code>, validar proveedor
        (OpenAI/Gemini) y revisar cómo el concierge conversa, recomienda tours reales y prepara handoff comercial.
      </p>

      <AiHandoffControlDeck />

      <div className="grid gap-3 md:grid-cols-3">
        {[
          ['Travel concierge', 'Recomendaciones reales desde el catálogo y orientación por estilo, ciudad o presupuesto.'],
          ['Lead handoff', 'Captura de email/WhatsApp y continuidad comercial cuando el viajero aún no compra.'],
          ['Recovery path', 'Mensajes para recuperar intención después de cancelación o dudas antes del checkout.'],
        ].map(([title, copy]) => (
          <article key={title} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black/40">
            <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
            <p className="mt-2 text-sm text-[color:var(--color-text)]/70">{copy}</p>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a
          href="/admin/tickets"
          className="rounded-xl bg-brand-blue px-3 py-2 text-sm text-white shadow-soft hover:shadow-pop"
        >
          Abrir tickets / handoff
        </a>
        <a
          href="/admin/ai/playbook"
          className="rounded-xl bg-black/10 px-3 py-2 text-sm text-[color:var(--color-text)] hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15"
        >
          Abrir IA Playbook
        </a>
        <span className="text-xs text-[color:var(--color-text)]/60">
          Define respuestas/políticas aprobadas para que la IA sea consistente.
        </span>
      </div>

      <section className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-soft dark:border-white/10 dark:bg-black/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl text-brand-blue">Mapa de continuidad comercial</h2>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/70">Lectura rápida para que chat, contacto y CRM no trabajen como silos.</p>
          </div>
          <span className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/55">sales continuity</span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ['Chat', 'Orienta, resume y abre contacto o ticket sin perder contexto.'],
            ['Contacto', 'Recibe ciudad, tour, fechas y motivo para no reiniciar el caso.'],
            ['CRM', 'Lead, deal y task quedan listos cuando el caso ya merece seguimiento.'],
            ['Founder lane', 'Sales y soporte leen prioridad de respuesta en ventanas reales.'],
          ].map(([title, copy]) => (
            <article key={title} className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-soft dark:border-white/10 dark:bg-black/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl text-brand-blue">Founder response windows</h2>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/70">Lectura rápida para no responder todo igual: cuándo toca founder lane, cuándo operador y cómo leer prioridad por ciudad y tipo de caso.</p>
          </div>
          <span className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/55">response ops</span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ['≤2h', 'Booking, post-compra, cambio sensible o cliente caliente esperando respuesta humana.'],
            ['≤12h', 'Plan personalizado, premium handoff o lead ya listo para propuesta.'],
            ['Mismo día', 'Consulta general, catálogo o intención media que no puede quedarse sin siguiente paso.'],
            ['Operador', 'Higiene de datos, documentación, confirmaciones y rescate no urgente.'],
          ].map(([title, copy]) => (
            <article key={title} className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{copy}</p>
            </article>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            ['Bogotá', 'Base comercial: captar, calificar y cerrar con velocidad.'],
            ['La Victoria · Caldas', 'Diferenciación: vender experiencia propia con más contexto y preparación.'],
            ['Cartagena', 'Activo futuro: sembrar intención, continuidad y lista útil sin prometer de más.'],
          ].map(([title, copy]) => (
            <article key={title} className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-4 dark:border-white/10 dark:bg-black/20">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{copy}</p>
            </article>
          ))}
        </div>
      </section>


      <section className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-soft dark:border-white/10 dark:bg-black/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl text-brand-blue">Source → lane playbook</h2>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/70">Mapa rápido para que chat, plan y contacto no abran continuidad a ciegas: cada origen debe terminar en el carril correcto.</p>
          </div>
          <span className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/55">handoff map</span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ['Chat', 'Pregunta inicial, resumen útil y salida a contacto o plan personalizado.', '≤12h o mismo día', '/admin/ai'],
            ['Plan personalizado', 'Caso con ciudad, presupuesto, fechas e intereses; si deja contacto, merece continuidad comercial.', '≤12h', '/admin/tasks'],
            ['Contacto', 'Ticket + deal + task cuando el caso ya pide mano humana o propuesta seria.', '≤2h o ≤12h', '/admin/tickets'],
            ['Booking / soporte', 'No reabrir discovery: proteger continuidad y resolver con rapidez.', '≤2h', '/admin/bookings'],
          ].map(([title, copy, lane, href]) => (
            <a key={title} href={href} className="rounded-2xl border border-black/10 bg-black/5 p-4 transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
                <span className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text)]/58">{lane}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{copy}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-soft dark:border-white/10 dark:bg-black/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl text-brand-blue">Premium recovery loop</h2>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/70">Cuando el caso ya salió de discovery, IA debe ayudar a leer si toca venta, soporte, booking o simple higiene del sistema.</p>
          </div>
          <span className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/55">recovery ops</span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ['Sell', 'Si el caso todavía puede cerrar, la IA debe resumir, no distraer.'],
            ['Protect', 'Si ya hay post-compra o soporte, la prioridad es continuidad y confianza.'],
            ['Verify', 'Si hay duda de booking, invoice o links, redirige al truth correcto antes de responder.'],
            ['Assign', 'Si el valor está en higiene operativa, deja owner y siguiente paso claros.'],
          ].map(([title, copy]) => (
            <article key={title} className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-black/10 bg-white/80 p-5 shadow-soft dark:border-white/10 dark:bg-black/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl text-brand-blue">SOP comercial del concierge</h2>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/70">
              Flujo recomendado para que chat, contacto y CRM trabajen como un solo sistema.
            </p>
          </div>
          <span className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/55">
            founder ops
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {[
            ['1. Detectar intención', 'Ciudad, fechas, personas, presupuesto y si el caso es catálogo, plan o soporte.'],
            ['2. Capturar continuidad', 'Guardar email/WhatsApp solo con consentimiento y sin perder el resumen del caso.'],
            ['3. Abrir mano humana', 'Crear ticket/deal/task cuando el viajero pide ayuda real o el caso ya está listo para follow-up.'],
            ['4. Cerrar siguiente paso', 'Mover a tour, contacto o plan personalizado sin volver a empezar desde cero.'],
          ].map(([title, copy]) => (
            <article key={title} className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{copy}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          {[
            ['/admin/leads', 'Leads'],
            ['/admin/deals', 'Deals'],
            ['/admin/tasks', 'Tasks'],
            ['/admin/tickets', 'Tickets'],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-sm font-medium text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface-2)]"
            >
              Abrir {label}
            </a>
          ))}
        </div>
      </section>


      <section className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-soft dark:border-white/10 dark:bg-black/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl text-brand-blue">Premium handoff by case type</h2>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/70">No todos los casos deben caer en el mismo flujo. Usa esta lectura para decidir si toca vender, proteger continuidad o solo dejar higiene operativa.</p>
          </div>
          <span className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)]/55">case-type ops</span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ['Catálogo / tours', 'Empujar a detail, contacto o plan personalizado sin sobreexplicar.', 'mismo día'],
            ['Plan personalizado', 'Abrir continuidad comercial con deal y task cuando hay contacto y contexto.', '≤12h'],
            ['Booking / soporte', 'No reiniciar discovery. Resolver con rapidez y proteger confianza post-compra.', '≤2h'],
            ['Higiene / operador', 'Completar datos, asignar tarea y dejar el siguiente paso escrito.', 'operador'],
          ].map(([title, copy, lane]) => (
            <article key={title} className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
                <span className="rounded-full border border-black/10 bg-[color:var(--color-surface)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text)]/58">{lane}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{copy}</p>
            </article>
          ))}
        </div>
      </section>


      <section className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-soft dark:border-white/10 dark:bg-black/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl text-brand-blue">Founder continuity checklist</h2>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/70">Checklist rápido para que concierge, contacto y CRM abran continuidad útil, no ruido nuevo.</p>
          </div>
          <a href="/admin/sales" className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm font-medium text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface)]">Abrir sales</a>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ['1. Resumir', 'Deja ciudad, intención, contexto y siguiente paso en una sola lectura.'],
            ['2. Decidir carril', '≤2h, ≤12h, mismo día u operador según sensibilidad real del caso.'],
            ['3. Abrir continuidad', 'Cuando el caso ya merece mano humana, crea ticket/deal/task sin perder el hilo.'],
            ['4. No reiniciar', 'Si ya existe booking, soporte o propuesta, no vuelvas a discovery por costumbre.'],
          ].map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/70">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <AdminAiLabClient />
    </main>
  );
}
