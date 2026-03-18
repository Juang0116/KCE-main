import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, BookOpen, Clock } from 'lucide-react';

import { Markdown } from '@/components/Markdown';
import { getPublishedPostBySlug } from '@/features/content/content.server';
import { SITE_URL } from '@/lib/env';

export const revalidate = 600;

function baseUrl() {
  return (SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(/\/+$/, '');
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { item } = await getPublishedPostBySlug(slug);
  if (!item) return {};
  const url = `${baseUrl()}/blog/${item.slug}`;

  return {
    title: `${item.title} | KCE Blog`,
    description: item.excerpt ?? undefined,
    alternates: { canonical: url },
    openGraph: { title: item.title, description: item.excerpt ?? undefined, url, type: 'article', images: item.cover_url ? [{ url: item.cover_url }] : undefined },
    twitter: { card: item.cover_url ? 'summary_large_image' : 'summary', title: item.title, description: item.excerpt ?? undefined, images: item.cover_url ? [item.cover_url] : undefined },
  };
}

// Función auxiliar para estimar tiempo de lectura
function getReadingTime(text: string) {
  const wordsPerMinute = 200;
  const noOfWords = text.split(/\s/g).length;
  const minutes = noOfWords / wordsPerMinute;
  return Math.ceil(minutes);
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { item } = await getPublishedPostBySlug(slug);

  if (!item) notFound();

  const readingTime = getReadingTime(item.content_md || '');

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pb-32 pt-24 md:pt-32">
      
      {/* Navegación Superior */}
      <div className="mx-auto max-w-4xl px-6 mb-10">
        <Link href="/blog" className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/60 hover:text-brand-blue hover:border-brand-blue/30 hover:shadow-sm transition-all">
          <ArrowLeft className="h-3 w-3" /> Volver a Historias
        </Link>
      </div>

      {/* Contenedor Principal del Artículo */}
      <article className="mx-auto w-full max-w-4xl px-6">
        <div className="rounded-[3.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden">
          
          {/* Imagen de Cabecera */}
          {item.cover_url ? (
            <div className="relative aspect-[16/9] w-full md:aspect-[21/9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.cover_url} alt={item.title} loading="eager" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent"></div>
            </div>
          ) : (
            <div className="relative h-32 w-full bg-brand-blue/5 border-b border-brand-blue/10"></div>
          )}

          {/* Cuerpo del Artículo */}
          <div className={`px-8 md:px-16 lg:px-20 pb-20 ${item.cover_url ? '-mt-32 md:-mt-40 relative z-10' : 'pt-16'}`}>
            
            {/* Header del Post */}
            <header className="mb-16 text-center">
              {/* Metadatos */}
              <div className="mb-8 flex flex-wrap items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]/50">
                <span className="inline-flex items-center gap-1.5"><BookOpen className="h-3 w-3" /> Editorial KCE</span>
                <span className="h-1 w-1 rounded-full bg-[var(--color-border)]"></span>
                <span className="inline-flex items-center gap-1.5"><Clock className="h-3 w-3" /> {readingTime} min de lectura</span>
              </div>
              
              {/* Título */}
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-[var(--color-text)] leading-[1.1] mb-8 drop-shadow-sm">
                {item.title}
              </h1>

              {/* Excerpt / Subtítulo */}
              {item.excerpt && (
                <p className="mx-auto max-w-2xl text-lg md:text-xl font-light leading-relaxed text-[var(--color-text)]/70 italic border-l-2 border-brand-yellow/50 pl-6 text-left">
                  {item.excerpt}
                </p>
              )}

              {/* Tags */}
              {(item.tags ?? []).length > 0 && (
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  {(item.tags ?? []).map((tag: string) => (
                    <span key={tag} className="rounded-full border border-brand-blue/10 bg-brand-blue/5 px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest text-brand-blue">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* Contenido Markdown */}
            <div className="prose prose-lg md:prose-xl prose-slate max-w-none mx-auto font-light leading-relaxed text-[var(--color-text)]/80 prose-headings:font-heading prose-headings:text-brand-blue prose-a:text-brand-blue hover:prose-a:underline prose-img:rounded-[2rem] prose-img:shadow-xl prose-blockquote:border-l-brand-yellow prose-blockquote:text-[var(--color-text)]/70">
              <Markdown content={item.content_md} />
            </div>

          </div>
        </div>
      </article>
    </main>
  );
}