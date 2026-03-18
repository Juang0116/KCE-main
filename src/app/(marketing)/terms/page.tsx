import type { Metadata } from 'next';
import Link from 'next/link';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { Scale, ArrowRight, FileText, ShieldCheck } from 'lucide-react';

import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';

export const runtime = 'nodejs';

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(BASE_SITE_URL),
  title: 'Términos y Condiciones | KCE',
  description: 'Términos y condiciones de uso de Knowing Cultures Enterprise (KCE): reservas, pagos y responsabilidades.',
  alternates: { canonical: '/terms' },
  openGraph: {
    title: 'Términos y condiciones — KCE',
    description: 'Consulta reglas de uso, reservas, pagos y responsabilidades en KCE.',
    url: '/terms',
    type: 'article',
  },
};

async function loadTermsMarkdown() {
  const filePath = path.join(process.cwd(), 'src', 'content', 'legal', 'terms.es.md');
  try {
    return await readFile(filePath, 'utf-8');
  } catch (error) {
    return 'El documento de términos y condiciones no se encuentra disponible. Por favor contacta a support@kce.travel';
  }
}

export default async function TermsPage() {
  const md = await loadTermsMarkdown();

  return (
    <PageShell className="min-h-screen bg-[var(--color-bg)] pb-24 pt-12 md:pt-20">
      <div className="mx-auto max-w-7xl px-6">
        
        {/* CABECERA DEL DOCUMENTO */}
        <header className="mb-16 text-center max-w-3xl mx-auto">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue shadow-sm">
            <Scale className="h-3 w-3" /> Contrato de Servicio
          </div>
          <h1 className="font-heading text-4xl md:text-6xl text-brand-blue leading-[1.1] mb-8">
            Términos y <br/>
            <span className="text-brand-yellow font-light italic text-3xl md:text-5xl lg:text-6xl">Condiciones de Uso.</span>
          </h1>
          <p className="text-lg font-light leading-relaxed text-[var(--color-text)]/70">
            Reglas claras para proteger tu viaje y nuestra operación. Este documento rige la relación entre KCE y nuestros viajeros internacionales.
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-[1fr_320px] items-start">
          
          {/* CONTENIDO PRINCIPAL (MARKDOWN) */}
          <article className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 md:p-16 shadow-2xl relative overflow-hidden">
            {/* Sutil acento superior */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-blue via-brand-yellow to-brand-blue"></div>
            
            <div className="prose prose-lg prose-slate max-w-none font-light leading-relaxed text-[var(--color-text)]/80 
              prose-headings:font-heading prose-headings:text-brand-blue 
              prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:border-b prose-h2:border-[var(--color-border)] prose-h2:pb-6
              prose-h3:text-xl prose-h3:mt-12 prose-h3:mb-6
              prose-strong:font-semibold prose-strong:text-brand-blue
              prose-a:text-brand-blue prose-a:font-bold hover:prose-a:underline
              prose-ul:list-disc prose-ul:pl-6 prose-li:my-3
              prose-blockquote:border-l-4 prose-blockquote:border-brand-yellow prose-blockquote:bg-brand-blue/5 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:italic prose-blockquote:text-brand-blue prose-blockquote:rounded-r-3xl
            ">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
              >
                {md}
              </ReactMarkdown>
            </div>
          </article>

          {/* SIDEBAR LEGAL NAVEGABLE */}
          <aside className="space-y-6 sticky top-32">
            
            <div className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
              <h3 className="font-heading text-xl text-brand-blue mb-8">Centro Legal</h3>
              <nav className="flex flex-col gap-3">
                {[
                  { label: 'Privacidad', href: '/privacy' },
                  { label: 'Cancelaciones', href: '/policies/cancellation' },
                  { label: 'Cookies', href: '/cookies' },
                  { label: 'Pagos', href: '/policies/payments' }
                ].map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className="group flex items-center justify-between rounded-2xl bg-[var(--color-surface-2)] p-4 border border-[var(--color-border)] hover:border-brand-blue/30 transition-all shadow-sm"
                  >
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text)]/40 group-hover:text-brand-blue transition-colors">{item.label}</span>
                    <ArrowRight className="h-4 w-4 text-brand-blue/20 group-hover:text-brand-blue transition-all group-hover:translate-x-1" />
                  </Link>
                ))}
              </nav>
            </div>

            {/* CAJA DE SOPORTE DIRECTO */}
            <div className="rounded-[3rem] bg-brand-blue/5 border border-brand-blue/10 p-10 text-center shadow-inner relative overflow-hidden group">
               <ShieldCheck className="absolute -right-6 -bottom-6 h-32 w-32 text-brand-blue/5 transition-transform group-hover:scale-110" />
               <div className="relative z-10">
                <div className="inline-flex rounded-2xl bg-brand-blue/10 p-4 text-brand-blue mb-6">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="font-heading text-xl text-brand-blue mb-4">¿Dudas legales?</h3>
                <p className="text-sm font-light text-[var(--color-text)]/60 mb-8 leading-relaxed">
                  Si alguna cláusula no está clara o necesitas asistencia personalizada sobre tu reserva, contáctanos.
                </p>
                <Button asChild className="w-full rounded-full shadow-lg">
                  <Link href="/contact">Hablar con KCE</Link>
                </Button>
               </div>
            </div>

          </aside>

        </div>
      </div>
    </PageShell>
  );
}