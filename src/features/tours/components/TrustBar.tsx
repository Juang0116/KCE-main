// src/features/tours/components/TrustBar.tsx
import { ShieldCheck, CalendarClock, MessageCircle, RotateCcw } from 'lucide-react';

type Props = {
  compact?: boolean;
};

export function TrustBar({ compact = false }: Props) {
  const items = [
    {
      icon: ShieldCheck,
      title: 'Pago seguro (EUR)',
      desc: 'Stripe + 3D Secure cuando aplique. Cobro en EUR.',
    },
    {
      icon: CalendarClock,
      title: 'Confirmación clara',
      desc: 'Recibes booking + factura PDF por email.',
    },
    {
      icon: RotateCcw,
      title: 'Cambios / cancelación',
      desc: 'Política clara (revisa “Cancelación”).',
    },
    {
      icon: MessageCircle,
      title: 'Soporte humano',
      desc: 'WhatsApp/email si necesitas ayuda.',
    },
  ];

  return (
    <div className={compact ? 'grid gap-3' : 'card p-6'}>
      {!compact ? (
        <h3 className="font-heading text-base text-brand-blue">Compra con confianza</h3>
      ) : null}

      <div className={compact ? 'grid gap-2' : 'mt-4 grid gap-3'}>
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div
              key={it.title}
              className={
                compact
                  ? 'flex items-start gap-3 rounded-2xl bg-[color:var(--color-card)] p-3'
                  : 'flex items-start gap-3 rounded-2xl bg-[color:var(--color-card)] p-3'
              }
            >
              <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[color:var(--color-muted)]">
                <Icon className="h-5 w-5 text-brand-blue" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--color-text)]">{it.title}</p>
                <p className="mt-0.5 text-sm text-[color:var(--color-text)]/75">{it.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
