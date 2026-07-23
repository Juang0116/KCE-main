/* src/app/(marketing)/blog/[slug]/page.tsx */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, BookOpen, Clock, Share2, ChevronRight } from 'lucide-react';

import { Markdown } from '@/components/Markdown';
import { Button } from '@/components/ui/Button';
import { getPublishedPostBySlug } from '@/features/content/content.server';
import { SITE_URL } from '@/lib/env';

export const revalidate = 600;

function baseUrl() {
  return (SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://kce.travel').replace(/\/+$/, '');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { item } = await getPublishedPostBySlug(slug);
  if (!item) return {};
  const url = `${baseUrl()}/blog/${item.slug}`;

  return {
    title: `${item.title} | Crónicas KCE`,
    description: item.excerpt ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      title: item.title,
      description: item.excerpt ?? undefined,
      url,
      type: 'article',
      images: item.cover_url ? [{ url: item.cover_url }] : undefined,
    },
    twitter: {
      card: item.cover_url ? 'summary_large_image' : 'summary',
      title: item.title,
      description: item.excerpt ?? undefined,
      images: item.cover_url ? [item.cover_url] : undefined,
    },
  };
}

function getReadingTime(text: string) {
  const wordsPerMinute = 200;
  const noOfWords = text?.split(/\s/g).length || 0;
  return Math.ceil(noOfWords / wordsPerMinute);
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { item } = await getPublishedPostBySlug(slug);

  if (!item) notFound();

  const readingTime = getReadingTime(item.content_md || '');

  return (
    <main className="min-h-screen animate-fade-in bg-base pb-32">
      {/* BRANDING KCE FORZADO: Texto nítido y elegante */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .prose-kce p, .prose-kce li { 
          color: var(--color-text-muted) !important; 
          font-weight: 300 !important;
          line-height: 1.85 !important;
          margin-bottom: 2rem !important;
          font-size: 1.125rem !important;
        }
        .prose-kce h2 { 
          color: var(--color-text) !important;
          font-family: var(--font-heading) !important;
          font-size: 2.25rem !important;
          font-weight: 700 !important;
          letter-spacing: -0.025em !important;
          margin-top: 4rem !important;
          margin-bottom: 1.5rem !important;
        }
        .prose-kce h3 {
          color: var(--color-text) !important;
          font-family: var(--font-heading) !important;
          font-size: 1.75rem !important;
          font-weight: 600 !important;
          letter-spacing: -0.025em !important;
          margin-top: 3rem !important;
          margin-bottom: 1rem !important;
        }
        .prose-kce strong { 
          color: var(--color-text) !important; 
          font-weight: 600 !important;
        }
        .prose-kce blockquote {
          border-left: 4px solid var(--color-brand-yellow) !important; /* Amarillo KCE */
          background: var(--color-surface) !important;
          padding: 2.5rem !important;
          margin: 3rem 0 !important;
          border-radius: 0 1.5rem 1.5rem 0 !important;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05) !important;
        }
        .prose-kce blockquote p {
          color: var(--color-text) !important;
          font-family: var(--font-heading) !important;
          font-size: 1.5rem !important;
          font-style: italic !important;
          line-height: 1.5 !important;
          margin: 0 !important;
          opacity: 0.9 !important;
        }
        .prose-kce a {
          color: var(--color-brand-blue) !important;
          text-decoration: underline !important;
          text-underline-offset: 4px !important;
        }
      `,
        }}
      />

      {/* 01. NAVIGATION */}
      <nav className="bg-surface/90 sticky top-0 z-40 w-full border-b border-brand-dark/5 py-4 shadow-sm backdrop-blur-xl dark:border-white/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-main transition-colors hover:text-brand-blue"
          >
            <ArrowLeft className="h-4 w-4 text-brand-blue transition-transform group-hover:-translate-x-1" />
            Revista KCE
          </Link>
          <div className="flex items-center gap-6">
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.3em] text-muted md:block">
              Knowing Cultures Enterprise
            </span>
            <button className="group flex h-10 w-10 items-center justify-center rounded-full border border-brand-dark/5 bg-surface-2 text-main transition-colors hover:border-brand-blue/30 dark:border-white/5">
              <Share2 className="h-4 w-4 transition-colors group-hover:text-brand-blue" />
            </button>
          </div>
        </div>
      </nav>

      {/* 02. COVER */}
      {item.cover_url && (
        <div className="relative h-[65vh] w-full overflow-hidden bg-brand-dark">
          <img
            src={item.cover_url}
            alt={item.title}
            className="h-full w-full object-cover opacity-90 transition-transform duration-1000 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-dark/20 to-base" />
        </div>
      )}

      {/* 03. ARTICLE */}
      <article
        className={`mx-auto max-w-4xl px-6 ${item.cover_url ? '-mt-32 md:-mt-48' : 'pt-24'} relative z-10`}
      >
        <div className="overflow-hidden rounded-[var(--radius-2xl)] border border-brand-dark/5 bg-surface shadow-soft dark:border-white/5">
          <div className="px-8 py-16 md:px-20 md:py-24">
            <header className="mb-16 border-b border-brand-dark/5 pb-16 text-center dark:border-white/5">
              <div className="mb-8 flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
                <BookOpen className="h-4 w-4 text-brand-yellow" />
                <span>Crónica de Viaje</span>
                <span className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20"></span>
                <span className="text-brand-blue">{readingTime} MIN READ</span>
              </div>

              <h1 className="mb-8 font-heading text-4xl leading-[1.05] tracking-tight text-main md:text-6xl">
                {item.title}
              </h1>

              {item.excerpt && (
                <p className="mx-auto max-w-2xl text-xl font-light italic leading-relaxed text-muted md:text-2xl">
                  &quot;{item.excerpt}&quot;
                </p>
              )}
            </header>

            <div className="prose-kce prose prose-lg mx-auto max-w-none font-body md:prose-xl">
              <Markdown content={item.content_md} />
            </div>

            {/* CTA FOOTER */}
            <footer className="mt-24 border-t border-brand-dark/5 pt-16 dark:border-white/5">
              <div className="group relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-[var(--radius-2xl)] bg-brand-dark p-12 text-center shadow-soft md:flex-row md:p-16 md:text-left">
                <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-brand-yellow/10 blur-[80px] transition-transform duration-700 group-hover:scale-125" />
                <div className="relative z-10 max-w-lg">
                  <h4 className="mb-3 font-heading text-3xl tracking-tight text-white md:text-4xl">
                    Vive esta experiencia
                  </h4>
                  <p className="text-base font-light leading-relaxed text-white/80 md:text-lg">
                    Nuestros expertos locales te llevan a descubrir los rincones de los que hablamos
                    en este artículo.
                  </p>
                </div>
                <div className="relative z-10 shrink-0">
                  <Button
                    asChild
                    className="rounded-full bg-brand-yellow px-10 py-7 text-xs font-bold uppercase tracking-widest text-brand-dark shadow-pop transition-transform hover:-translate-y-1 hover:bg-white"
                  >
                    <Link href="/tours">
                      Explorar Tours <ChevronRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </article>
    </main>
  );
}
