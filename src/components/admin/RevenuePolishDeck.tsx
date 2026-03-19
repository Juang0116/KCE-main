'use client';

import Link from 'next/link';
import { 
  Receipt, 
  PackageCheck, 
  UserCircle2, 
  ShieldCheck, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import clsx from 'clsx';

const cards = [
  {
    icon: Receipt,
    eyebrow: 'Delivery Truth',
    title: 'Revenue Ledger',
    body: 'Cruza paid session, booking, invoice y account antes de declarar una venta como cerrada.',
    href: '/admin/revenue',
    label: 'Abrir Revenue',
  },
  {
    icon: PackageCheck,
    eyebrow: 'Booking Ops',
    title: 'Bookings Command',
    body: 'Entra a reservas para revisar assets, recovery o fricción post-compra en casos concretos.',
    href: '/admin/bookings',
    label: 'Ver Bookings',
  },
  {
    icon: UserCircle2,
    eyebrow: 'Traveler Experience',
    title: 'Account View',
    body: 'Confirma cómo vive el viajero su reserva: descargas, soporte y continuidad premium.',
    href: '/account/bookings',
    label: 'Abrir Account',
  },
  {
    icon: ShieldCheck,
    eyebrow: 'Release Confidence',
    title: 'QA + Hardening',
    body: 'Si algo no cuadra, vuelve a QA y runbooks antes de tocar soporte manual.',
    href: '/admin/qa',
    label: 'Abrir QA',
  },
] as const;

type Props = {
  title?: string;
  description?: string;
};

export default function RevenuePolishDeck({
  title = 'Final Revenue Polish Deck',
  description = 'Usa este deck para cerrar el loop completo: cobro confirmado, assets listos, cuenta clara y recovery preparado si algo se interrumpe.',
}: Props) {
  return (
    <section className="rounded-brand-2xl border border-brand-dark/10 bg-[linear-gradient(135deg,rgba(10,61,128,0.05),rgba(216,176,74,0.05),rgba(255,255,255,0.95))] p-6 shadow-soft md:p-10 backdrop-blur-sm">
      
      {/* Header: Meta y Propósito */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-white/80 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue/60 shadow-sm">
            <Sparkles className="h-3 w-3" />
            Revenue Polish
          </div>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-brand-blue md:text-4xl">
            {title}
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-muted">
            {description}
          </p>
        </div>
        
        <div className="rounded-2xl border border-brand-blue/5 bg-white/60 p-5 text-sm shadow-hard backdrop-blur-md">
          <p className="font-medium text-brand-blue/80 italic">
            "Meta del sprint: Cero fricción entre cierre, entrega y soporte."
          </p>
        </div>
      </div>

      {/* Grid de Auditoría Final */}
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article 
              key={card.title} 
              className="group relative flex flex-col rounded-brand-lg border border-brand-dark/5 bg-white/70 p-6 shadow-soft transition-all duration-300 hover:border-brand-blue/20 hover:bg-white hover:shadow-hard"
            >
              <div className="flex items-center gap-3 text-muted/40 transition-colors group-hover:text-brand-blue">
                <Icon className="h-5 w-5" />
                <div className="text-[10px] font-bold uppercase tracking-widest">
                  {card.eyebrow}
                </div>
              </div>

              <div className="mt-5 flex-1">
                <h3 className="font-heading text-lg font-bold text-brand-blue">
                  {card.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  {card.body}
                </p>
              </div>

              <div className="mt-8">
                <Link
                  href={card.href}
                  className="inline-flex w-full items-center justify-between rounded-xl border border-brand-blue/10 bg-brand-blue/5 px-4 py-2.5 text-xs font-bold text-brand-blue transition-all hover:bg-brand-blue hover:text-white"
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