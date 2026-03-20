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
    <main className="min-h-screen bg-[color:var(--color-bg)] pb-24 animate-fade-in">
      
      {/* 01. HEADER EDITORIAL - BRANDING KCE */}
      <header className="relative overflow-hidden bg-brand-blue px-6 py-24 md:py-32 text-center">
        {/* Imagen de fondo sutil */}
        <div className="absolute inset-0 opacity-20 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay scale-105 animate-slow-zoom"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-blue)] via-[var(--brand-blue)]/80 to-transparent"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue backdrop-blur-md">
            <BookOpen className="h-3.5 w-3.5" /> Edición 2026
          </div>
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-white tracking-tighter leading-[0.9]">
            Crónicas de <br />
            <span className="text-brand-yellow font-light italic">Colombia.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-lg font-light leading-relaxed text-white/70 md:text-xl">
            Narrativas locales para entender la cultura colombiana antes de tu próxima expedición.
          </p>
        </div>
      </header>

      {/* 02. GRILLA ASIMÉTRICA */}
      <section className="mx-auto max-w-6xl px-6 -mt-16 relative z-20">
        {items.length === 0 ? (
          <div className="rounded-[3rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] py-24 text-center shadow-2xl">
            <PenTool className="mx-auto h-12 w-12 text-slate-200 mb-6" />
            <h2 className="font-heading text-3xl text-brand-blue mb-2">Redacción en curso</h2>
            <p className="text-[color:var(--color-text-muted)] max-w-xs mx-auto font-light">Estamos preparando crónicas exclusivas para ti.</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p, index) => {
              const isFeatured = index === 0;
              return (
                <Link
                  key={p.id}
                  // Aseguramos que el slug no tenga espacios accidentales
                  href={`/blog/${p.slug.trim()}`}
                  className={`group flex flex-col overflow-hidden rounded-[2.5rem] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-soft transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${isFeatured ? 'sm:col-span-2 lg:col-span-2' : ''}`}
                >
                  {/* Capa de Imagen */}
                  <div className={`relative overflow-hidden bg-[color:var(--color-surface-2)] ${isFeatured ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
                    {p.cover_url ? (
                      <img 
                        src={p.cover_url} 
                        alt={p.title} 
                        className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[color:var(--color-surface-2)]">
                        <PenTool className="h-10 w-10 text-slate-200" />
                      </div>
                    )}
                    {/* Tag de Categoría */}
                    {(p.tags ?? []).length > 0 && (
                      <div className="absolute top-6 left-6">
                        <span className="rounded-full bg-brand-yellow px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest text-brand-blue shadow-lg">
                          {p.tags![0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Capa de Texto */}
                  <div className="flex flex-1 flex-col p-8 md:p-10">
                    <div className="mb-4 flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)]">
                      <Clock className="h-3 w-3" /> 5 MIN READ
                    </div>
                    
                    <h2 className={`font-heading text-[color:var(--color-text)] leading-tight group-hover:text-brand-blue transition-colors mb-4 ${isFeatured ? 'text-3xl md:text-5xl' : 'text-2xl'}`}>
                      {p.title}
                    </h2>
                    
                    {p.excerpt && (
                      <p className={`font-light leading-relaxed text-[color:var(--color-text-muted)] ${isFeatured ? 'text-lg line-clamp-3' : 'text-sm line-clamp-3'}`}>
                        {p.excerpt}
                      </p>
                    )}

                    <div className="mt-auto pt-8 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue/40 group-hover:text-brand-blue transition-colors">
                        Leer Crónica
                      </span>
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all duration-300">
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
        <div className="h-px w-24 bg-brand-yellow mx-auto mb-12" />
        <h3 className="font-heading text-3xl text-[color:var(--color-text)] mb-6">Únete a la expedición editorial</h3>
        <p className="text-[color:var(--color-text-muted)] font-light mb-10">Recibe crónicas y secretos culturales de Colombia cada mes.</p>
        <Link href="/contact" className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-blue hover:text-brand-blue transition-colors">
          Suscribirse a la Revista
        </Link>
      </section>
    </main>
  );
}