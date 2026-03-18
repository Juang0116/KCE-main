import Link from 'next/link';
import { listPublishedPosts } from '@/features/content/content.server';
import type { Metadata } from 'next';
import { PenTool, ArrowRight, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog | KCE',
  description: 'Historias, guías y tips de cultura para viajar por Colombia.',
  robots: { index: true, follow: true },
};

export const revalidate = 600;

export default async function BlogIndexPage() {
  const { items } = await listPublishedPosts({ limit: 24 });

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pb-24">
      
      {/* HEADER REVISTA DE VIAJES */}
      <header className="relative overflow-hidden bg-brand-dark px-6 py-24 md:py-32 text-center shadow-xl">
        <div className="absolute inset-0 opacity-20 bg-[url('/images/hero-kce.jpg')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-brand-blue/30"></div>
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-yellow/30 bg-brand-yellow/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-yellow backdrop-blur-md shadow-sm">
            <BookOpen className="h-3 w-3" /> Revista de Viajes KCE
          </div>
          <h1 className="font-heading text-4xl leading-tight md:text-6xl lg:text-7xl text-white drop-shadow-md">
            Historias que <span className="text-brand-yellow font-light italic">inspiran.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-white/80 md:text-xl">
            Descubre datos curiosos, guías locales y secretos culturales para que vivas y entiendas Colombia mucho antes de aterrizar.
          </p>
        </div>
      </header>

      {/* GRILLA DE ARTÍCULOS EDITORIALES */}
      <section className="mx-auto max-w-6xl px-6 -mt-10 relative z-20">
        {items.length === 0 ? (
          <div className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] py-24 text-center shadow-xl">
            <div className="inline-flex rounded-full bg-brand-blue/10 p-4 text-brand-blue mb-4">
              <PenTool className="h-8 w-8" />
            </div>
            <h2 className="font-heading text-3xl text-brand-blue mb-2">Estamos escribiendo...</h2>
            <p className="text-sm font-light text-[var(--color-text)]/60 max-w-md mx-auto leading-relaxed">
              Nuestro equipo editorial está preparando guías exclusivas. Vuelve pronto para descubrir nuevas historias.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p, index) => (
              <Link
                key={p.id}
                href={`/blog/${p.slug}`}
                className={`group flex flex-col justify-between overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-hard hover:border-brand-blue/30 ${index === 0 ? 'sm:col-span-2 lg:col-span-2 sm:flex-row' : ''}`}
              >
                {/* Imagen del Post */}
                <div className={`relative overflow-hidden bg-[var(--color-surface-2)] ${index === 0 ? 'sm:w-1/2 aspect-square sm:aspect-auto' : 'aspect-[4/3] w-full'}`}>
                  {p.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.cover_url} alt={p.title} loading={index < 3 ? 'eager' : 'lazy'} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center border border-brand-blue/10 bg-brand-blue/5">
                      <PenTool className="h-10 w-10 text-brand-blue/20" />
                    </div>
                  )}
                  {/* Etiqueta flotante */}
                  {(p.tags ?? []).length > 0 && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur-md shadow-sm">
                        {p.tags![0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Contenido del Post */}
                <div className={`flex flex-col p-8 ${index === 0 ? 'sm:w-1/2 justify-center' : 'flex-1'}`}>
                  <h2 className={`font-heading text-[var(--color-text)] leading-tight group-hover:text-brand-blue transition-colors mb-4 ${index === 0 ? 'text-3xl md:text-4xl' : 'text-2xl'}`}>
                    {p.title}
                  </h2>
                  
                  {p.excerpt && (
                    <p className={`font-light leading-relaxed text-[var(--color-text)]/70 ${index === 0 ? 'text-base line-clamp-4' : 'text-sm line-clamp-3'}`}>
                      {p.excerpt}
                    </p>
                  )}

                  <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40">
                      Editorial KCE
                    </span>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}