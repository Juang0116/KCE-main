/* src/app/(marketing)/terms/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import {
  Scale,
  ArrowRight,
  FileText,
  ShieldCheck,
  ChevronRight,
  BookmarkCheck,
  Landmark,
  Gavel,
  Sparkles,
  Globe2,
} from 'lucide-react';

import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';

export const runtime = 'nodejs';

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(
  /\/+$/,
  '',
);

export const metadata: Metadata = {
  metadataBase: new URL(BASE_SITE_URL),
  title: 'Términos y Condiciones | Knowing Cultures S.A.S.',
  description:
    'Contrato legal de uso y contratación de servicios turísticos de Knowing Cultures S.A.S. (KCE).',
  alternates: { canonical: '/terms' },
};

async function loadTermsMarkdown() {
  const filePath = path.join(process.cwd(), 'src', 'content', 'legal', 'terms.es.md');
  try {
    return await readFile(filePath, 'utf-8');
  } catch (error) {
    return '# Documento en Carga\nEstamos sincronizando los términos legales. Por favor, regresa en unos instantes.';
  }
}

export default async function TermsPage() {
  const md = await loadTermsMarkdown();

  return (
    <PageShell className="relative min-h-screen animate-fade-in overflow-x-hidden bg-base pb-32">
      {/* 01. HERO INSTITUCIONAL (Estilo Premium KCE) */}
      <section className="relative mb-20 overflow-hidden border-b border-white/5 bg-brand-dark px-6 py-28 text-center md:py-40">
        {/* Capas de resplandor inmersivo */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-full max-w-4xl -translate-x-1/2 rounded-full bg-brand-blue/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-brand-yellow/5 blur-[120px]" />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center">
          <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.4em] text-white shadow-xl backdrop-blur-md">
            <Gavel className="h-4 w-4 text-brand-yellow" /> Marco Legal Vigente 2026
          </div>

          <h1 className="mb-10 font-heading text-6xl leading-[1] tracking-tighter text-white md:text-8xl lg:text-9xl">
            Términos & <br />
            <span className="font-light italic text-brand-yellow opacity-90">Condiciones.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-xl font-light leading-relaxed text-white/60 md:text-2xl">
            Acuerdo legal vinculante para el acceso, registro y contratación de experiencias de{' '}
            <span className="font-medium text-white">Knowing Cultures S.A.S.</span>
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[var(--container-max)] px-6">
        <div className="grid items-start gap-16 lg:grid-cols-[1fr_420px]">
          <div className="space-y-12">
            {/* FICHA TÉCNICA EDITORIAL */}
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-soft transition-colors hover:border-brand-blue/20">
                <div className="mb-6 flex items-center gap-4 text-brand-blue">
                  <div className="rounded-xl bg-brand-blue/5 p-3">
                    <Landmark className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                    Entidad Responsable
                  </span>
                </div>
                <p className="text-sm font-light leading-relaxed text-muted">
                  <strong className="mb-1 block font-bold text-main">Razón Social:</strong> Knowing
                  Cultures S.A.S.
                  <br />
                  <strong className="mb-1 mt-3 block font-bold text-main">Domicilio:</strong>{' '}
                  Bogotá, República de Colombia
                  <br />
                  <strong className="mb-1 mt-3 block font-bold text-main">
                    Jurisdicción:
                  </strong>{' '}
                  República de Colombia
                </p>
              </div>
              <div className="group rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-soft transition-colors hover:border-brand-yellow/20">
                <div className="mb-6 flex items-center gap-4 text-brand-yellow">
                  <div className="rounded-xl bg-brand-yellow/5 p-3">
                    <BookmarkCheck className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                    Estatus del Documento
                  </span>
                </div>
                <p className="text-sm font-light leading-relaxed text-muted">
                  <strong className="mb-1 block font-bold text-main">Vigencia:</strong> Desde el 1
                  de enero de 2026
                  <br />
                  <strong className="mb-1 mt-3 block font-bold text-main">
                    Última Revisión:
                  </strong>{' '}
                  Marzo 2026
                  <br />
                  <strong className="mb-1 mt-3 block font-bold text-main">Naturaleza:</strong>{' '}
                  Obligatorio y Vinculante
                </p>
              </div>
            </div>

            {/* CUERPO DEL CONTRATO */}
            <article className="group relative overflow-hidden rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-10 shadow-pop dark:border-white/5 md:p-20 lg:p-24">
              {/* Marca de agua de fondo corregida */}
              <div className="pointer-events-none absolute -bottom-32 -right-32 z-0 text-brand-blue opacity-[0.02] transition-transform duration-[2000ms] group-hover:-rotate-6 group-hover:scale-110">
                <ShieldCheck className="h-[600px] w-[600px]" />
              </div>

              <div className="relative z-10">
                <div
                  className="prose prose-lg max-w-none md:prose-xl 
                  prose-headings:font-heading prose-headings:tracking-tight prose-headings:text-main
                  prose-h2:mb-12 prose-h2:mt-24 prose-h2:border-b prose-h2:border-brand-dark/5 prose-h2:pb-8 prose-h2:text-4xl prose-h3:mb-8
                  prose-h3:mt-16 prose-h3:text-2xl prose-h3:text-brand-blue prose-p:mb-8 prose-p:font-light
                  prose-p:leading-relaxed prose-p:text-muted prose-blockquote:rounded-[var(--radius-2xl)] prose-blockquote:border-l-4
                  prose-blockquote:border-brand-yellow prose-blockquote:bg-surface-2
                  prose-blockquote:px-10 prose-blockquote:py-2
                  prose-blockquote:italic prose-strong:font-bold prose-strong:text-main
                  prose-ul:list-none prose-ul:pl-0 prose-li:relative prose-li:mb-4 prose-li:pl-8 prose-li:before:absolute prose-li:before:left-0 prose-li:before:top-3
                  prose-li:before:h-1.5 prose-li:before:w-1.5 prose-li:before:rounded-full prose-li:before:bg-brand-yellow prose-li:before:content-[''] md:prose-h2:text-5xl md:prose-h3:text-3xl
                "
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                  >
                    {md}
                  </ReactMarkdown>
                </div>
              </div>

              <div className="relative z-10 mt-32 flex flex-col items-center justify-between gap-8 border-t border-brand-dark/5 pt-16 text-[10px] font-bold uppercase tracking-[0.3em] text-muted opacity-40 sm:flex-row">
                <span>Knowing Cultures S.A.S. • 2026</span>
                <div className="flex items-center gap-2">
                  <Globe2 className="h-3 w-3" /> Bogotá, Colombia
                </div>
              </div>
            </article>
          </div>

          {/* SIDEBAR LEGAL (Sólido & Premium) */}
          <aside className="sticky top-32 space-y-10">
            <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-12 shadow-soft">
              <h3 className="mb-10 font-heading text-3xl tracking-tight text-main">Centro Legal</h3>
              <nav className="flex flex-col gap-4">
                {[
                  { label: 'Privacidad', href: '/privacy' },
                  { label: 'Cancelaciones', href: '/policies/cancellation' },
                  { label: 'Cookies', href: '/cookies' },
                  { label: 'Soporte', href: '/contact' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center justify-between rounded-2xl border border-brand-dark/5 bg-surface-2 p-6 transition-all duration-500 hover:border-brand-blue/30 hover:bg-surface hover:shadow-md"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted transition-colors group-hover:text-brand-blue">
                      {item.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-brand-blue opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                  </Link>
                ))}
              </nav>
            </div>

            <div className="group relative overflow-hidden rounded-[var(--radius-3xl)] bg-brand-dark p-12 text-white shadow-pop">
              {/* Resplandor de acento en el sidebar */}
              <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 -translate-y-1/2 translate-x-1/2 rounded-full bg-brand-blue/10 blur-3xl" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-10 inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-brand-yellow shadow-inner transition-transform duration-700 group-hover:rotate-6 group-hover:scale-110">
                  <FileText className="h-10 w-10" />
                </div>
                <h3 className="mb-6 font-heading text-3xl tracking-tight">Conciergerie</h3>
                <p className="mb-12 text-base font-light leading-relaxed text-white/50">
                  ¿Tienes alguna duda sobre nuestras cláusulas de seguridad o logística? Nuestro
                  equipo humano está listo para atenderte.
                </p>
                <Button
                  asChild
                  className="group/btn h-auto w-full rounded-full border-transparent bg-brand-blue py-8 text-white shadow-xl transition-all hover:bg-white hover:text-brand-dark"
                >
                  <Link
                    href="/contact"
                    className="flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.2em]"
                  >
                    Hablar con un Experto{' '}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mención legal flotante sutil */}
      <div className="mt-32 py-10 text-center opacity-20">
        <p className="text-[9px] font-bold uppercase tracking-[0.5em]">
          Legales KCE • Sincronizado 2026
        </p>
      </div>
    </PageShell>
  );
}
