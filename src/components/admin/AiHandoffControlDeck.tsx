import Link from "next/link";

import { Button } from "@/components/ui/Button";

type Props = {
  eyebrow?: string;
  title?: string;
  description?: string;
};

const pillars = [
  {
    title: 'Capture',
    copy: 'Cada conversación útil debe salir con lead guardado o con intención explícita de seguimiento.',
  },
  {
    title: 'Handoff',
    copy: 'Cuando el viajero pide ayuda humana, IA, tickets y CRM deben compartir el mismo contexto.',
  },
  {
    title: 'Recover',
    copy: 'Si no compró hoy, la señal tiene que caer en sales, deals o sequence sin perder velocidad.',
  },
];

export function AiHandoffControlDeck({
  eyebrow = 'AI → CRM Bridge',
  title = 'AI handoff command desk',
  description = 'Coordina la transición entre concierge, lead capture, soporte humano y seguimiento comercial para que ninguna intención útil se pierda.',
}: Props) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-black/10 bg-[linear-gradient(135deg,rgba(3,56,110,.98),rgba(8,25,54,.96))] text-white shadow-[0_20px_60px_rgba(3,56,110,.28)]">
      <div className="grid gap-6 px-5 py-6 md:grid-cols-[1.3fr_.9fr] md:px-7 md:py-8">
        <div className="space-y-4">
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
            {eyebrow}
          </div>
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl leading-tight text-white md:text-[2rem]">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-white/78 md:text-[15px]">{description}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-yellow">{pillar.title}</div>
                <p className="mt-2 text-sm leading-6 text-white/78">{pillar.copy}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-white/12 bg-white/8 p-5 backdrop-blur">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Operational lane</div>
          <div className="mt-3 space-y-3 text-sm text-white/80">
            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
              1. Descubrir intención en chat y guardar contacto válido.
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
              2. Crear ticket o deal cuando pida ayuda humana o muestre intención de compra.
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
              3. Releer la señal en sales/tickets y confirmar si el follow-up ya quedó asignado.
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Button asChild variant="secondary">
              <Link href="/admin/ai">Abrir IA</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/15 bg-white/8 text-white hover:bg-white/12">
              <Link href="/admin/tickets">Abrir tickets</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/15 bg-white/8 text-white hover:bg-white/12">
              <Link href="/admin/leads">Ver leads</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/15 bg-white/8 text-white hover:bg-white/12">
              <Link href="/admin/sales">Ver sales</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
