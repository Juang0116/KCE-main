/* src/app/(marketing)/terms/page.tsx */
import type { Metadata } from 'next';
import Link from 'next/link';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { 
  Scale, ArrowRight, FileText, ShieldCheck, 
  ChevronRight, BookmarkCheck, Landmark, Gavel, 
  Sparkles, Globe2 
} from 'lucide-react';

import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';

export const runtime = 'nodejs';

const BASE_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(/\/+$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(BASE_SITE_URL),
  title: 'Términos y Condiciones | Knowing Cultures S.A.S.',
  description: 'Contrato legal de uso y contratación de servicios turísticos de Knowing Cultures S.A.S. (KCE).',
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
    <PageShell className="min-h-screen bg-base pb-32 animate-fade-in relative overflow-x-hidden">
      
      {/* 01. HERO INSTITUCIONAL (Estilo Premium KCE) */}
      <section className="relative overflow-hidden bg-brand-dark px-6 py-28 md:py-40 text-center border-b border-white/5 mb-20">
        {/* Capas de resplandor inmersivo */}
        <div className="absolute top-0 left-1/2 w-full max-w-4xl h-80 bg-brand-blue/10 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-yellow/5 rounded-full blur-[120px] pointer-events-none translate-x-1/3 translate-y-1/3" />
        
        <div className="relative z-10 mx-auto max-w-5xl flex flex-col items-center">
          <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.4em] text-white shadow-xl backdrop-blur-md">
            <Gavel className="h-4 w-4 text-brand-yellow" /> Marco Legal Vigente 2026
          </div>
          
          <h1 className="font-heading text-6xl md:text-8xl lg:text-9xl text-white tracking-tighter leading-[1] mb-10">
            Términos & <br/>
            <span className="text-brand-yellow font-light italic opacity-90">Condiciones.</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-xl md:text-2xl font-light leading-relaxed text-white/60">
            Acuerdo legal vinculante para el acceso, registro y contratación de experiencias de <span className="text-white font-medium">Knowing Cultures S.A.S.</span>
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[var(--container-max)] px-6">
        <div className="grid gap-16 lg:grid-cols-[1fr_420px] items-start">
          
          <div className="space-y-12">
            {/* FICHA TÉCNICA EDITORIAL */}
            <div className="grid sm:grid-cols-2 gap-8">
               <div className="bg-surface border border-brand-dark/5 p-10 rounded-[var(--radius-3xl)] shadow-soft group hover:border-brand-blue/20 transition-colors">
                  <div className="flex items-center gap-4 mb-6 text-brand-blue">
                     <div className="p-3 bg-brand-blue/5 rounded-xl">
                        <Landmark className="h-6 w-6" />
                     </div>
                     <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Entidad Responsable</span>
                  </div>
                  <p className="text-sm text-muted font-light leading-relaxed">
                    <strong className="text-main font-bold block mb-1">Razón Social:</strong> Knowing Cultures S.A.S.<br/>
                    <strong className="text-main font-bold block mt-3 mb-1">Domicilio:</strong> Bogotá, República de Colombia<br/>
                    <strong className="text-main font-bold block mt-3 mb-1">Jurisdicción:</strong> República de Colombia
                  </p>
               </div>
               <div className="bg-surface border border-brand-dark/5 p-10 rounded-[var(--radius-3xl)] shadow-soft group hover:border-brand-yellow/20 transition-colors">
                  <div className="flex items-center gap-4 mb-6 text-brand-yellow">
                     <div className="p-3 bg-brand-yellow/5 rounded-xl">
                        <BookmarkCheck className="h-6 w-6" />
                     </div>
                     <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Estatus del Documento</span>
                  </div>
                  <p className="text-sm text-muted font-light leading-relaxed">
                    <strong className="text-main font-bold block mb-1">Vigencia:</strong> Desde el 1 de enero de 2026<br/>
                    <strong className="text-main font-bold block mt-3 mb-1">Última Revisión:</strong> Marzo 2026<br/>
                    <strong className="text-main font-bold block mt-3 mb-1">Naturaleza:</strong> Obligatorio y Vinculante
                  </p>
               </div>
            </div>

            {/* CUERPO DEL CONTRATO */}
            <article className="rounded-[var(--radius-3xl)] border border-brand-dark/5 dark:border-white/5 bg-surface p-10 md:p-20 lg:p-24 shadow-pop relative overflow-hidden group">
              {/* Marca de agua de fondo corregida */}
              <div className="absolute -bottom-32 -right-32 opacity-[0.02] text-brand-blue pointer-events-none transition-transform duration-[2000ms] group-hover:scale-110 group-hover:-rotate-6 z-0">
                <ShieldCheck className="h-[600px] w-[600px]" />
              </div>
              
              <div className="relative z-10">
                <div className="prose prose-lg md:prose-xl max-w-none 
                  prose-headings:font-heading prose-headings:text-main prose-headings:tracking-tight
                  prose-h2:text-4xl md:prose-h2:text-5xl prose-h2:mt-24 prose-h2:mb-12 prose-h2:pb-8 prose-h2:border-b prose-h2:border-brand-dark/5
                  prose-h3:text-2xl md:prose-h3:text-3xl prose-h3:mt-16 prose-h3:mb-8 prose-h3:text-brand-blue
                  prose-p:text-muted prose-p:font-light prose-p:leading-relaxed prose-p:mb-8
                  prose-strong:font-bold prose-strong:text-main
                  prose-ul:list-none prose-ul:pl-0
                  prose-li:relative prose-li:pl-8 prose-li:mb-4
                  prose-li:before:content-[''] prose-li:before:absolute prose-li:before:left-0 prose-li:before:top-3 prose-li:before:h-1.5 prose-li:before:w-1.5 prose-li:before:rounded-full prose-li:before:bg-brand-yellow
                  prose-blockquote:border-l-4 prose-blockquote:border-brand-yellow prose-blockquote:bg-surface-2 prose-blockquote:rounded-[var(--radius-2xl)] prose-blockquote:py-2 prose-blockquote:px-10 prose-blockquote:italic
                ">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                    {md}
                  </ReactMarkdown>
                </div>
              </div>

              <div className="mt-32 pt-16 border-t border-brand-dark/5 flex flex-col sm:flex-row items-center justify-between gap-8 opacity-40 text-[10px] font-bold uppercase tracking-[0.3em] text-muted relative z-10">
                <span>Knowing Cultures S.A.S. • 2026</span>
                <div className="flex items-center gap-2">
                   <Globe2 className="h-3 w-3" /> Bogotá, Colombia
                </div>
              </div>
            </article>
          </div>

          {/* SIDEBAR LEGAL (Sólido & Premium) */}
          <aside className="space-y-10 sticky top-32">
            <div className="rounded-[var(--radius-3xl)] border border-brand-dark/5 bg-surface p-12 shadow-soft">
              <h3 className="font-heading text-3xl text-main mb-10 tracking-tight">Centro Legal</h3>
              <nav className="flex flex-col gap-4">
                {[
                  { label: 'Privacidad', href: '/privacy' },
                  { label: 'Cancelaciones', href: '/policies/cancellation' },
                  { label: 'Cookies', href: '/cookies' },
                  { label: 'Soporte', href: '/contact' }
                ].map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className="group flex items-center justify-between rounded-2xl bg-surface-2 p-6 border border-brand-dark/5 hover:bg-surface hover:border-brand-blue/30 transition-all duration-500 hover:shadow-md"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted group-hover:text-brand-blue transition-colors">{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-brand-blue opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </nav>
            </div>

            <div className="rounded-[var(--radius-3xl)] bg-brand-dark p-12 text-white shadow-pop relative overflow-hidden group">
               {/* Resplandor de acento en el sidebar */}
               <div className="absolute top-0 right-0 w-48 h-48 bg-brand-blue/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
               
               <div className="relative z-10 flex flex-col items-center text-center">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-brand-yellow mb-10 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700">
                  <FileText className="h-10 w-10" />
                </div>
                <h3 className="font-heading text-3xl mb-6 tracking-tight">Conciergerie</h3>
                <p className="text-base font-light text-white/50 mb-12 leading-relaxed">
                  ¿Tienes alguna duda sobre nuestras cláusulas de seguridad o logística? Nuestro equipo humano está listo para atenderte.
                </p>
                <Button asChild className="w-full rounded-full bg-brand-blue text-white hover:bg-white hover:text-brand-dark transition-all py-8 h-auto border-transparent shadow-xl group/btn">
                  <Link href="/contact" className="text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                    Hablar con un Experto <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-2" />
                  </Link>
                </Button>
               </div>
            </div>
          </aside>
        </div>
      </div>
      
      {/* Mención legal flotante sutil */}
      <div className="mt-32 py-10 text-center opacity-20">
         <p className="text-[9px] font-bold uppercase tracking-[0.5em]">Legales KCE • Sincronizado 2026</p>
      </div>
    </PageShell>
  );
}