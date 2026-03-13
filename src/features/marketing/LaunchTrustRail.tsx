import Link from "next/link";
import { Cookie, FileCheck2, LifeBuoy, LockKeyhole } from "lucide-react";

type Variant = 'lead' | 'postpurchase';

type Props = {
  locale: string;
  className?: string;
  variant?: Variant;
};

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export default function LaunchTrustRail({ locale, className, variant = 'lead' }: Props) {
  const copy =
    variant === 'postpurchase'
      ? {
          eyebrow: 'release confidence',
          title: 'Seguridad, soporte y reglas claras después de comprar',
          subtitle:
            'Mantén a mano los accesos legales y operativos que protegen la compra: soporte humano, privacidad, cookies y reglas del servicio.',
          cards: [
            {
              title: 'Soporte y continuidad',
              description: 'Si necesitas cambios, seguimiento o ayuda sensible, usa contacto para retomar tu caso sin perder contexto.',
              href: withLocale(locale, '/contact'),
              cta: 'Abrir contacto',
              Icon: LifeBuoy,
            },
            {
              title: 'Privacidad y datos',
              description: 'Revisa cómo KCE trata los datos de tu booking, soporte y comunicaciones post-compra.',
              href: withLocale(locale, '/privacy'),
              cta: 'Ver privacidad',
              Icon: LockKeyhole,
            },
            {
              title: 'Términos, pagos y reglas',
              description: 'Consulta reservas, cambios, pagos, responsabilidades y reglas operativas del servicio.',
              href: withLocale(locale, '/terms'),
              cta: 'Ver términos',
              Icon: FileCheck2,
            },
          ],
          footer: {
            label: 'Cookies y preferencias',
            href: withLocale(locale, '/cookies'),
            copy: 'Ajusta cookies y preferencias técnicas cuando lo necesites.',
          },
        }
      : {
          eyebrow: 'trust & release hygiene',
          title: 'Privacidad, reglas y soporte visibles desde el núcleo público',
          subtitle:
            'El lanzamiento premium también necesita confianza visible: cómo se usan tus datos, dónde pedir ayuda y qué reglas aplican antes de reservar.',
          cards: [
            {
              title: 'Privacidad y datos',
              description: 'Entiende cómo KCE usa los datos de contacto, booking, soporte y seguridad antes de enviarnos tu caso.',
              href: withLocale(locale, '/privacy'),
              cta: 'Ver privacidad',
              Icon: LockKeyhole,
            },
            {
              title: 'Términos, pagos y reglas',
              description: 'Consulta condiciones, pagos, cambios, cancelaciones y responsabilidades generales del servicio.',
              href: withLocale(locale, '/terms'),
              cta: 'Ver términos',
              Icon: FileCheck2,
            },
            {
              title: 'Cookies y preferencias',
              description: 'Decide qué medición y marketing permites sin comprometer el funcionamiento básico del sitio.',
              href: withLocale(locale, '/cookies'),
              cta: 'Gestionar cookies',
              Icon: Cookie,
            },
          ],
          footer: {
            label: '¿Necesitas ayuda humana?',
            href: withLocale(locale, '/contact'),
            copy: 'Abre contacto si tu caso necesita continuidad manual, soporte o una respuesta comercial más precisa.',
          },
        };

  return (
    <section
      className={cx(
        'rounded-[2rem] border border-brand-blue/10 bg-[color:var(--color-surface)] p-6 shadow-soft md:p-8',
        className,
      )}
      aria-label="Trust, legal and support"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-text)]/55">{copy.eyebrow}</p>
          <h2 className="mt-2 font-heading text-2xl text-brand-blue">{copy.title}</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-brand-blue">
          launch-ready trust
        </div>
      </div>

      <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--color-text)]/72">{copy.subtitle}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {copy.cards.map(({ title, description, href, cta, Icon }) => (
          <div key={title} className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-5">
            <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-heading text-xl text-brand-blue">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-text)]/72">{description}</p>
            <Link href={href} className="mt-4 inline-flex text-sm font-semibold text-brand-blue underline underline-offset-4 hover:opacity-90">
              {cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3 text-sm text-[color:var(--color-text)]/72">
        <span className="font-semibold text-[color:var(--color-text)]">{copy.footer.label}: </span>
        <span>{copy.footer.copy} </span>
        <Link href={copy.footer.href} className="font-semibold text-brand-blue underline underline-offset-4 hover:opacity-90">
          Abrir
        </Link>
      </div>
    </section>
  );
}
