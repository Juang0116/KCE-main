/* src/app/(marketing)/blog/page.tsx */
import Link from 'next/link';
import { listPublishedPosts } from '@/features/content/content.server';
import type { Metadata } from 'next';
import { PenTool, ArrowRight, BookOpen, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Revista Editorial | KCE Colombia',
  description: 'Historias, guías y tips de cultura para viajar por Colombia.',
  robots: { index: true, follow: true },
};

export const revalidate = 600;

export default async function BlogIndexPage() {
  const { items } = await listPublishedPosts({ limit: 24 });

  return (
    <main className="min-h-screen bg-base pb-24 animate-fade-in">
      
      {/* 01. HEADER EDITORIAL - BRANDING KCE */}
      <header className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center border-b border-brand-dark/10">
        {/* Imagen de fondo sutil */}
        <div className="absolute inset-0 opacity-20 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay scale-105 animate-slow-zoom"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent"></div>
        
        {/* Destello sutil azul medianoche */}
        <div className="absolute top-1/2 left-1/2 w-full max-w-3xl h-64 bg-brand-blue/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-yellow shadow-sm backdrop-blur-md">
            <BookOpen className="h-3.5 w-3.5" /> Edición 2026
          </div>
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-white tracking-tight leading-[1.05] drop-shadow-md">
            Crónicas de <br />
            <span className="text-brand-yellow font-light italic opacity-90">Colombia.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg md:text-xl font-light leading-relaxed text-white/80">
            Narrativas locales para entender la cultura colombiana antes de tu próxima expedición.
          </p>
        </div>
      </header>

      {/* 02. GRILLA ASIMÉTRICA */}
      <section className="mx-auto max-w-[var(--container-max)] px-6 pt-24 pb-12 relative z-20">
        {items.length === 0 ? (
          <div className="rounded-[var(--radius-2xl)] border border-brand-dark/5 dark:border-white/5 bg-surface py-24 text-center shadow-soft">
            <PenTool className="mx-auto h-16 w-16 text-muted mb-6 opacity-50" />
            <h2 className="font-heading text-3xl md:text-4xl text-main tracking-tight mb-4">Redacción en curso</h2>
            <p className="text-lg text-muted font-light max-w-md mx-auto">Estamos preparando crónicas exclusivas para ti.</p>
          </div>
        ) : (
          <div className="grid gap-10 sm:gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p, index) => {
              const isFeatured = index === 0;
              return (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug.trim()}`}
                  className={`group flex flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/5 dark:border-white/5 bg-surface shadow-soft transition-all duration-500 hover:-translate-y-2 hover:shadow-pop hover:border-brand-blue/30 ${isFeatured ? 'sm:col-span-2 lg:col-span-2' : ''}`}
                >
                  {/* Capa de Imagen */}
                  <div className={`relative overflow-hidden bg-brand-dark ${isFeatured ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
                    {p.cover_url ? (
                      <>
                        <img 
                          src={p.cover_url} 
                          alt={p.title} 
                          className="h-full w-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-surface-2 border-b border-brand-dark/5 dark:border-white/5">
                        <PenTool className="h-10 w-10 text-muted opacity-30" />
                      </div>
                    )}
                    {/* Tag de Categoría */}
                    {(p.tags ?? []).length > 0 && (
                      <div className="absolute top-6 left-6">
                        <span className="rounded-full bg-brand-yellow px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest text-brand-dark shadow-sm">
                          {p.tags![0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Capa de Texto */}
                  <div className="flex flex-1 flex-col p-8 md:p-12">
                    <div className="mb-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted">
                      <Clock className="h-4 w-4 text-brand-blue" /> 5 MIN READ
                    </div>
                    
                    <h2 className={`font-heading text-main tracking-tight leading-[1.15] group-hover:text-brand-blue transition-colors mb-6 ${isFeatured ? 'text-4xl md:text-5xl' : 'text-3xl'}`}>
                      {p.title}
                    </h2>
                    
                    {p.excerpt && (
                      <p className={`font-light leading-relaxed text-muted ${isFeatured ? 'text-lg line-clamp-3' : 'text-base line-clamp-3'}`}>
                        {p.excerpt}
                      </p>
                    )}

                    <div className="mt-auto pt-10 flex items-center justify-between border-t border-brand-dark/5 dark:border-white/5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted group-hover:text-brand-blue transition-colors">
                        Leer Crónica
                      </span>
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-brand-dark/5 dark:border-white/5 bg-surface-2 text-main group-hover:bg-brand-blue group-hover:border-brand-blue group-hover:text-white transition-all duration-300">
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 03. FOOTER NEWSLETTER */}
      <section className="mx-auto max-w-4xl px-6 py-32 text-center">
        <div className="h-1 w-16 bg-brand-yellow mx-auto mb-10 rounded-full" />
        <h3 className="font-heading text-4xl md:text-5xl text-main tracking-tight mb-6">Únete a la expedición editorial</h3>
        <p className="text-lg text-muted font-light leading-relaxed mb-12">Recibe crónicas exclusivas y secretos culturales de Colombia en tu bandeja de entrada.</p>
        <Link href="/contact" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue hover:text-brand-dark transition-colors group">
          Suscribirse a la Revista <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </section>
    </main>
  );
}