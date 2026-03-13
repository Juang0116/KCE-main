import clsx from 'clsx';
import { BadgeCheck, CalendarClock, ShieldCheck, Sparkles } from 'lucide-react';

type Props = {
  className?: string;
};

const ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Acceso protegido',
    detail: 'Tu booking se comparte con enlace firmado y acciones seguras.',
  },
  {
    icon: CalendarClock,
    title: 'Todo centralizado',
    detail: 'Factura, calendario y soporte desde un mismo punto.',
  },
  {
    icon: BadgeCheck,
    title: 'Pago verificado',
    detail: 'El flujo queda pensado para que el cierre se sienta claro y profesional.',
  },
  {
    icon: Sparkles,
    title: 'Siguiente paso guiado',
    detail: 'Siempre tienes una acción clara para continuar sin fricción.',
  },
] as const;

export default function BookingTrustStrip({ className }: Props) {
  return (
    <section className={clsx('grid gap-3 md:grid-cols-2 xl:grid-cols-4', className)}>
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)]/95 p-4 shadow-soft"
          >
            <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue ring-1 ring-brand-blue/15">
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-heading text-base text-brand-blue">{item.title}</h3>
            <p className="mt-1 text-sm text-[color:var(--color-text)]/70">{item.detail}</p>
          </div>
        );
      })}
    </section>
  );
}
