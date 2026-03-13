/* src/app/(marketing)/social/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';

import SocialLinks from '@/components/SocialLinks';

export const metadata: Metadata = {
  title: 'Redes y contenido — KCE',
  description:
    'Encuentra nuestras redes sociales y contenido oficial: Facebook, Instagram, TikTok, YouTube y X.',
  robots: { index: false, follow: true },
};

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface-2)] p-6 shadow-soft">
      <div className="text-sm font-semibold text-[color:var(--color-text)]">{title}</div>
      {desc ? <p className="mt-2 text-sm text-[color:var(--color-text)]/70">{desc}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

function InlineCta({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-sm font-medium text-[color:var(--color-text)]/85 shadow-soft transition hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text)] !no-underline hover:!no-underline"
    >
      <span>{label}</span>
      <span aria-hidden="true" className="text-[color:var(--color-text)]/50">
        →
      </span>
    </Link>
  );
}

export default function SocialPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="card p-8 md:p-10">
        {/* Hero */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-xs text-[color:var(--color-text)]/70">
            <span className="font-semibold text-brand-blue">KCE</span>
            <span className="opacity-70">·</span>
            <span>Canales oficiales · capa secundaria</span>
          </div>

          <h1 className="font-heading text-3xl text-brand-blue md:text-4xl">
            Redes y contenido
          </h1>

          <p className="max-w-3xl text-[color:var(--color-text)]/75">
            Esta página reúne los canales oficiales de KCE. Es útil para seguir la marca y validar perfiles, pero la entrada principal para comprar o pedir ayuda sigue siendo Tours, Plan personalizado y Contacto.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <InlineCta href="/tours" label="Explorar tours" />
            <InlineCta href="/plan" label="Plan personalizado" />
            <InlineCta href="/contact" label="Hablar con KCE" />
          </div>
        </header>

        {/* Social links */}
        <section className="mt-8">
          <Card
            title="Nuestras redes"
            desc="Encuentra los canales oficiales y evita perfiles falsos. Si compartes un link de KCE, el preview debe mostrar imagen + descripción."
          >
            <SocialLinks variant="solid" />

            <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text)]/60">
                Tip
              </div>
              <p className="mt-2 text-sm text-[color:var(--color-text)]/70">
                Si el preview no carga (WhatsApp/Instagram), normalmente es por caché. Intenta
                reenviar el link o compártelo de nuevo unos minutos después.
              </p>
            </div>
          </Card>
        </section>

        {/* Content / Capture */}
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <Card
            title="Contenido"
            desc="Blog y vlog se mantienen como capa editorial secundaria para reforzar confianza, contexto y marca."
          >
            <div className="flex flex-wrap gap-3">
              <InlineCta href="/blog" label="Ir al blog" />
              <InlineCta href="/vlog" label="Ir al vlog" />
            </div>
            <p className="mt-4 text-xs text-[color:var(--color-text)]/60">
              En el MVP, algunas secciones pueden estar en construcción mientras se publica el
              contenido.
            </p>
          </Card>

          <Card
            title="Captación"
            desc="Si prefieres una recomendación concreta, sal de esta capa y vuelve al núcleo comercial de KCE para comparar tours, abrir tu plan o hablar con el equipo."
          >
            <div className="flex flex-wrap gap-3">
              <InlineCta href="/plan" label="Abrir plan personalizado" />
              <InlineCta href="/tours" label="Ver tours" />
            </div>
            <p className="mt-4 text-xs text-[color:var(--color-text)]/60">
              Si quieres ayuda humana, usa la página de contacto o el chat de soporte.
            </p>
          </Card>
        </section>

        {/* Footer links */}
        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link
            href="/contact"
            className="text-brand-blue underline underline-offset-4 hover:opacity-90"
          >
            Contacto
          </Link>
          <Link
            href="/faq"
            className="text-brand-blue underline underline-offset-4 hover:opacity-90"
          >
            FAQ
          </Link>
          <Link
            href="/"
            className="text-brand-blue underline underline-offset-4 hover:opacity-90"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
