'use client';

import Link from 'next/link';
import { 
  ShieldAlert, 
  Database, 
  Terminal, 
  Activity, 
  ArrowUpRight,
  Lock 
} from 'lucide-react';
import clsx from 'clsx';

const cards = [
  {
    icon: ShieldAlert,
    eyebrow: 'QA Gate',
    title: 'Revenue QA',
    body: 'Corre QA base, preflight y RC verify antes de empujar cambios o compras de prueba.',
    href: '/admin/qa',
    label: 'Abrir QA',
    status: 'Ready',
  },
  {
    icon: Database,
    eyebrow: 'Delivery Truth',
    title: 'Bookings + Entrega',
    body: 'Confirma booking, invoice, email y assets desde la vista operativa de reservas.',
    href: '/admin/bookings',
    label: 'Ver Bookings',
    status: 'Live',
  },
  {
    icon: Terminal,
    eyebrow: 'Ops Recovery',
    title: 'Runbooks',
    body: 'Si algo se rompe en checkout o webhooks, entra directo al manual de recuperación.',
    href: '/admin/ops/runbooks',
    label: 'Abrir Runbooks',
    status: 'Critical',
  },
  {
    icon: Lock,
    eyebrow: 'System Gate',
    title: 'System Status',
    body: 'Verifica secrets, dependencias y señales de salud antes de pasar a producción.',
    href: '/admin/system',
    label: 'Ver Sistema',
    status: 'Stable',
  },
] as const;

type Props = {
  title?: string;
  description?: string;
  compact?: boolean;
};

export default function RevenueHardeningDeck({
  title = 'Revenue Hardening Command Deck',
  description = 'La meta no es solo que compile: es saber si KCE puede cobrar, persistir y entregarse sin perder la confianza del viajero.',
  compact = false,
}: Props) {
  return (
    <section className="rounded-brand-2xl border border-brand-dark/10 bg-surface p-6 shadow-hard md:p-8">
      {/* Header con Badge de Estado */}
      <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue/60">
            <Activity className="h-3 w-3" />
            Hardening Deck
          </div>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-brand-blue md:text-4xl">
            {title}
          </h2>
          <p className="text-base leading-relaxed text-muted">
            {description}
          </p>
        </div>
        
        {!compact && (
          <div className="rounded-xl border border-brand-blue/10 bg-brand-blue/5 p-5 transition-all hover:bg-brand-blue/[0.08]">
            <p className="max-w-[240px] text-xs leading-relaxed text-brand-blue/80">
              <span className="font-bold text-brand-blue">Shortcut:</span> Valida ingresos, entrega y recovery antes de escalar el tráfico de campañas.
            </p>
          </div>
        )}
      </div>

      {/* Grid de Comandos */}
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article 
              key={card.title} 
              className="group relative flex flex-col rounded-brand-lg border border-brand-dark/5 bg-surface-2 p-6 transition-all duration-300 hover:border-brand-blue/20 hover:bg-surface hover:shadow-soft"
            >
              <header className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl border border-brand-dark/5 bg-surface shadow-sm group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5 text-brand-blue" />
                </div>
                <span className={clsx(
                  "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                  card.status === 'Critical' ? "bg-red-50 text-red-600 border-red-100" : "bg-brand-blue/5 text-brand-blue border-brand-blue/10"
                )}>
                  {card.status}
                </span>
              </header>

              <div className="mt-6 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                  {card.eyebrow}
                </div>
                <h3 className="mt-2 font-heading text-lg font-bold text-main">
                  {card.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted/80">
                  {card.body}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-brand-dark/5">
                <Link
                  href={card.href}
                  className="inline-flex w-full items-center justify-between rounded-lg bg-brand-blue px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-brand-dark active:scale-95"
                >
                  {card.label}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}