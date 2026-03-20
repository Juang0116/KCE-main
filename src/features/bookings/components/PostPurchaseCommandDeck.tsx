import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { CalendarPlus2, LifeBuoy, ReceiptText, Sparkles } from 'lucide-react';

type Props = {
  eyebrow?: string;
  title: string;
  body: string;
  accountHref: string;
  supportHref: string;
  toursHref: string;
  className?: string;
};

export default function PostPurchaseCommandDeck({
  eyebrow = 'post-purchase desk',
  title,
  body,
  accountHref,
  supportHref,
  toursHref,
  className,
}: Props) {
  return (
    <section
      className={[
        'rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8',
        className || '',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">{eyebrow}</p>
          <h2 className="mt-2 font-heading text-2xl text-brand-blue md:text-3xl">{title}</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-brand-blue">
          journey continuity
        </div>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/72 md:text-base">{body}</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <article className="rounded-3xl border border-brand-blue/10 bg-[linear-gradient(135deg,rgba(12,31,69,0.96),rgba(24,92,194,0.88))] p-5 text-white shadow-soft">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/72">
            <Sparkles className="size-3.5" aria-hidden="true" />
            central access
          </div>
          <h3 className="mt-4 font-heading text-2xl text-white">Gestiona todo desde una sola ruta</h3>
          <p className="mt-2 text-sm leading-6 text-white/80">
            Factura, calendario, soporte y siguientes pasos deberían sentirse como una sola experiencia, no como piezas sueltas.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild className="bg-[color:var(--color-surface)] text-brand-blue hover:shadow-pop">
              <Link href={accountHref}>Ir a mi cuenta</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
              <Link href={supportHref}>Pedir soporte</Link>
            </Button>
          </div>
        </article>

        <article className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
          <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
            <ReceiptText className="size-5" aria-hidden="true" />
          </div>
          <h3 className="mt-4 font-heading text-xl text-brand-blue">Assets de entrega</h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">
            Mantén la factura y el booking accesibles para reducir dudas después del pago.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[color:var(--color-text)]/68">
            <li>• Factura PDF y booking firmado</li>
            <li>• Continuidad hacia soporte</li>
            <li>• Mejor contexto para CRM</li>
          </ul>
        </article>

        <article className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
          <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
            <LifeBuoy className="size-5" aria-hidden="true" />
          </div>
          <h3 className="mt-4 font-heading text-xl text-brand-blue">Si necesitas ayuda</h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">
            Usa soporte humano si necesitas cambios, logística, reenvíos o seguimiento comercial.
          </p>
          <div className="mt-5 grid gap-3">
            <Button asChild variant="outline" className="justify-center">
              <Link href={supportHref}>Abrir soporte</Link>
            </Button>
            <Button asChild variant="ghost" className="justify-center">
              <Link href={toursHref}>Explorar más tours</Link>
            </Button>
          </div>
        </article>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/52">
        <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1.5">
          <CalendarPlus2 className="size-3.5 text-brand-blue" aria-hidden="true" />
          calendar ready
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1.5">
          <ReceiptText className="size-3.5 text-brand-blue" aria-hidden="true" />
          delivery assets
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1.5">
          <LifeBuoy className="size-3.5 text-brand-blue" aria-hidden="true" />
          human support
        </span>
      </div>
    </section>
  );
}
