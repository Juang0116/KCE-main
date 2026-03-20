import type { Metadata } from 'next';
import Link from 'next/link';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { Scale, ArrowRight, FileText, ShieldCheck, ChevronRight } from 'lucide-react';

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
    <PageShell className="min-h-screen bg-[color:var(--color-bg)] pb-32 pt-16 md:pt-24 animate-fade-in">
      <div className="mx-auto max-w-[var(--container-max)] px-6">
        
        {/* 01. HEADER (Estatura Legal) */}
        <header className="mb-20 text-center max-w-4xl mx-auto flex flex-col items-center">
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[color:var(--color-text-muted)] shadow-soft">
            <Scale className="h-3.5 w-3.5 text-brand-blue" /> Contrato de Servicio
          </div>
          
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-[color:var(--color-text)] tracking-tight leading-[1] mb-10">
            Términos & <br/>
            <span className="text-brand-blue font-light italic">Condiciones.</span>
          </h1>
          
          <div className="h-px w-24 bg-brand-yellow mb-10" />
          
          <p className="text-xl font-light leading-relaxed text-[color:var(--color-text-muted)] max-w-2xl">
            Reglas claras para proteger tu viaje y nuestra operación. Este documento rige la relación entre KCE y nuestros viajeros internacionales.
          </p>
        </header>

        <div className="grid gap-16 lg:grid-cols-[1fr_360px] items-start">
          
          {/* 02. EL MANUSCRITO (Contenido Progresivo) */}
          <article className="rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-10 md:p-16 lg:p-20 shadow-soft relative overflow-hidden group">
            {/* Sutil marca de agua de seguridad */}
            <ShieldCheck className="absolute -top-10 -right-10 h-64 w-64 text-brand-blue/[0.02] -rotate-12 pointer-events-none" />
            
            <div className="prose prose-lg prose-slate max-w-none font-light leading-relaxed text-[color:var(--color-text-muted)] 
              prose-headings:font-heading prose-headings:text-[color:var(--color-text)] prose-headings:tracking-tight
              prose-h2:text-3xl prose-h2:mt-20 prose-h2:mb-10 prose-h2:pb-6 prose-h2:border-b prose-h2:border-[color:var(--color-border)]
              prose-h3:text-xl prose-h3:mt-12 prose-h3:mb-6 prose-h3:text-brand-blue
              prose-strong:font-bold prose-strong:text-[color:var(--color-text)]
              prose-a:text-brand-blue prose-a:no-underline hover:prose-a:underline transition-all
              prose-ul:space-y-4 prose-li:marker:text-brand-blue
              prose-blockquote:border-l-2 prose-blockquote:border-brand-yellow prose-blockquote:bg-[color:var(--color-surface-2)] prose-blockquote:py-8 prose-blockquote:px-10 prose-blockquote:italic prose-blockquote:text-[color:var(--color-text)] prose-blockquote:rounded-2xl prose-blockquote:shadow-inner
            ">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
              >
                {md}
              </ReactMarkdown>
            </div>

            {/* Cierre del documento */}
            <div className="mt-20 pt-10 border-t border-[color:var(--color-border)] flex items-center justify-between opacity-40 italic text-xs">
              <span>Última actualización: 18 de Marzo, 2026</span>
              <span>KCE Legal Dept.</span>
            </div>
          </article>

          {/* 03. SIDEBAR (Directorio de Navegación) */}
          <aside className="space-y-8 sticky top-28">
            
            <div className="rounded-[var(--radius-2xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-10 shadow-soft">
              <h3 className="font-heading text-2xl text-[color:var(--color-text)] mb-8 tracking-tight">Centro Legal</h3>
              <nav className="flex flex-col gap-4">
                {[
                  { label: 'Privacidad', href: '/privacy' },
                  { label: 'Cancelaciones', href: '/policies/cancellation' },
                  { label: 'Cookies', href: '/cookies' },
                  { label: 'Pagos', href: '/policies/payments' }
                ].map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className="group flex items-center justify-between rounded-xl bg-[color:var(--color-surface-2)]/50 p-5 border border-[color:var(--color-border)] hover:bg-[color:var(--color-surface)] hover:border-brand-blue hover:shadow-soft transition-all"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--color-text-muted)] group-hover:text-brand-blue transition-colors">{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-[color:var(--color-text-muted)] opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </nav>
            </div>

            {/* SOPORTE (La Nota de Ayuda) */}
            <div className="rounded-[var(--radius-2xl)] bg-brand-blue p-12 text-white shadow-pop relative overflow-hidden group">
               {/* Decorative Element */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
               
               <div className="relative z-10 flex flex-col items-center text-center">
                <div className="inline-flex rounded-2xl bg-white/10 border border-white/10 p-5 text-brand-blue mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="font-heading text-2xl mb-4 tracking-tight">¿Dudas legales?</h3>
                <p className="text-sm font-light text-white/70 mb-10 leading-relaxed">
                  Si alguna cláusula no es clara o necesitas asistencia sobre tu contrato de viaje, nuestro equipo jurídico te apoya.
                </p>
                <Button asChild className="w-full rounded-full bg-brand-yellow text-brand-blue hover:bg-white transition-all py-7 h-auto shadow-xl group/btn">
                  <Link href="/contact" className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                    Hablar con KCE <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
               </div>
            </div>

          </aside>

        </div>
      </div>
    </PageShell>
  );
}