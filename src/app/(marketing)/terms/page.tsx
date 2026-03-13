// src/app/(marketing)/terms/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

export const runtime = 'nodejs';

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(BASE_SITE_URL),
  title: 'Términos — KCE',
  description:
    'Términos y condiciones de uso de Knowing Cultures Enterprise (KCE): reservas, pagos, cambios, cancelaciones y responsabilidades.',
  alternates: { canonical: '/terms' },
  openGraph: {
    title: 'Términos y condiciones — KCE',
    description: 'Consulta reglas de uso, reservas, pagos, cambios, cancelaciones y responsabilidades en KCE.',
    url: '/terms',
    type: 'article',
    images: [{ url: '/images/hero-kce.jpg', width: 1200, height: 630, alt: 'KCE términos y condiciones' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Términos y condiciones — KCE',
    description: 'Reglas de uso, reservas, pagos y responsabilidades de KCE.',
    images: ['/images/hero-kce.jpg'],
  },
};

async function loadTermsMarkdown() {
  const filePath = path.join(process.cwd(), 'src', 'content', 'legal', 'terms.es.md');
  return readFile(filePath, 'utf-8');
}

export default async function Page() {
  const md = await loadTermsMarkdown();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1 text-xs font-semibold text-[color:var(--color-text)]/70">
          Términos y condiciones · KCE
        </div>
        <h1 className="mt-4 font-heading text-3xl tracking-tight text-brand-blue">Términos y condiciones</h1>
        <p className="mt-3 text-sm leading-6 text-[color:var(--color-text)]/75">
          Aquí encontrarás las reglas generales de uso del sitio, reservas, pagos, cambios y responsabilidades.
          Si tienes dudas antes de pagar, te recomendamos revisar también la política de cancelación y la página de contacto.
        </p>
        <nav aria-label="Navegación legal" className="mt-5 flex flex-wrap gap-4 text-sm">
          <Link href="/privacy" className="text-brand-blue underline underline-offset-4 hover:opacity-90">
            Privacidad
          </Link>
          <Link href="/terms" className="text-brand-blue underline underline-offset-4 hover:opacity-90">
            Términos
          </Link>
          <Link href="/cookies" className="text-brand-blue underline underline-offset-4 hover:opacity-90">
            Cookies
          </Link>
          <Link href="/contact" className="text-brand-blue underline underline-offset-4 hover:opacity-90">
            Contacto
          </Link>
        </nav>
      </div>
      <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-soft sm:p-10">
        <div className="prose prose-neutral max-w-none dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
          >
            {md}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
