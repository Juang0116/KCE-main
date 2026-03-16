import Link from 'next/link';
import { listPublishedPosts } from '@/features/content/content.server';
import type { Metadata } from 'next';
import { PenTool, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog | KCE',
  description: 'Historias, guías y tips de cultura para viajar por Colombia.',
  robots: { index: true, follow: true },
};

export const revalidate = 600;

export default async function BlogIndexPage() {
  const { items } = await listPublishedPosts({ limit: 24 });

  return (
    <main className="min-h-screen bg-[color:var(--color-bg)] pb-24">
      
      {/* HEADER BLOG */}
      <header className="mx-auto max-w-4xl px-6 py-20 md:py-28 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-blue shadow-sm">
          <PenTool className="h-3 w-3" /> Blog de Viajes KCE
        </div>
        <h1 className="font-heading text-4xl leading-tight text-[var(--color-text)] md:text-6xl drop-shadow-sm">
          Historias que inspiran.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-[var(--color-text)]/70">
          Descubre datos curiosos, guías locales y secretos culturales para que vivas y entiendas Colombia mucho antes de aterrizar.
        </p>
      </header>

      {/* GRILLA DE ARTÍCULOS */}
      <section className="mx-auto max-w-6xl px-6">
        {items.length === 0 ? (
          <div className="rounded-[3rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-24 text-center shadow-sm">
            <h2 className="font-heading text-2xl text-brand-blue mb-2">Estamos escribiendo...</h2>
            <p className="text-sm font-light text-[var(--color-text)]/50">Aún no hay publicaciones en el blog. Vuelve pronto para descubrir nuevas historias.</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <Link
                key={p.id}
                href={`/blog/${p.slug}`}
                className="group flex flex-col justify-between overflow-hidden rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-pop hover:border-brand-blue/30"
              >
                <div>
                  {p.cover_url ? (
                    <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.cover_url} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                  ) : (
                    <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-2xl bg-brand-blue/5 flex items-center justify-center border border-brand-blue/10">
                      <PenTool className="h-10 w-10 text-brand-blue/20" />
                    </div>
                  )}

                  <h2 className="font-heading text-2xl text-[var(--color-text)] mb-3 leading-snug group-hover:text-brand-blue transition-colors">
                    {p.title}
                  </h2>
                  {p.excerpt ? (
                    <p className="text-sm font-light leading-relaxed text-[var(--color-text)]/70 line-clamp-3">
                      {p.excerpt}
                    </p>
                  ) : null}
                </div>

                <div className="mt-8 pt-5 border-t border-[var(--color-border)] flex items-end justify-between">
                  <div className="flex flex-wrap gap-2">
                    {(p.tags ?? []).slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-[var(--color-text)]/60">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-brand-blue group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Leer <ArrowRight className="h-3 w-3" />
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