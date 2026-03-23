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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { item } = await getPublishedPostBySlug(slug);
  if (!item) return {};
  const url = `${baseUrl()}/blog/${item.slug}`;

  return {
    title: `${item.title} | Crónicas KCE`,
    description: item.excerpt ?? undefined,
    alternates: { canonical: url },
    openGraph: { title: item.title, description: item.excerpt ?? undefined, url, type: 'article', images: item.cover_url ? [{ url: item.cover_url }] : undefined },
    twitter: { card: item.cover_url ? 'summary_large_image' : 'summary', title: item.title, description: item.excerpt ?? undefined, images: item.cover_url ? [item.cover_url] : undefined },
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
    <main className="min-h-screen bg-base pb-32 animate-fade-in">
      
      {/* BRANDING KCE FORZADO: Texto nítido y elegante */}
      <style dangerouslySetInnerHTML={{ __html: `
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
      `}} />

      {/* 01. NAVIGATION */}
      <nav className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-xl border-b border-brand-dark/5 dark:border-white/5 py-4 shadow-sm">
        <div className="mx-auto max-w-5xl px-6 flex justify-between items-center">
          <Link href="/blog" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-main hover:text-brand-blue transition-colors group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 text-brand-blue" /> 
            Revista KCE
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted hidden md:block">Knowing Cultures Enterprise</span>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 border border-brand-dark/5 dark:border-white/5 hover:border-brand-blue/30 text-main transition-colors group">
              <Share2 className="h-4 w-4 group-hover:text-brand-blue transition-colors" />
            </button>
          </div>
        </div>
      </nav>

      {/* 02. COVER */}
      {item.cover_url && (
        <div className="relative w-full h-[65vh] overflow-hidden bg-brand-dark">
          <img src={item.cover_url} alt={item.title} className="h-full w-full object-cover opacity-90 transition-transform duration-1000 hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-dark/20 to-base" />
        </div>
      )}

      {/* 03. ARTICLE */}
      <article className={`mx-auto max-w-4xl px-6 ${item.cover_url ? '-mt-32 md:-mt-48' : 'pt-24'} relative z-10`}>
        <div className="bg-surface border border-brand-dark/5 dark:border-white/5 rounded-[var(--radius-2xl)] shadow-soft overflow-hidden">
          <div className="px-8 md:px-20 py-16 md:py-24">
            
            <header className="mb-16 text-center border-b border-brand-dark/5 dark:border-white/5 pb-16">
              <div className="mb-8 flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
                <BookOpen className="h-4 w-4 text-brand-yellow" />
                <span>Crónica de Viaje</span>
                <span className="h-1 w-1 rounded-full bg-brand-dark/20 dark:bg-white/20"></span>
                <span className="text-brand-blue">{readingTime} MIN READ</span>
              </div>
              
              <h1 className="font-heading text-4xl md:text-6xl text-main leading-[1.05] mb-8 tracking-tight">
                {item.title}
              </h1>

              {item.excerpt && (
                <p className="text-xl md:text-2xl font-light leading-relaxed text-muted italic max-w-2xl mx-auto">
                  "{item.excerpt}"
                </p>
              )}
            </header>

            <div className="prose prose-lg md:prose-xl max-w-none mx-auto prose-kce font-body">
              <Markdown content={item.content_md} />
            </div>

            {/* CTA FOOTER */}
            <footer className="mt-24 pt-16 border-t border-brand-dark/5 dark:border-white/5">
              <div className="relative overflow-hidden bg-brand-dark p-12 md:p-16 rounded-[var(--radius-2xl)] flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left shadow-soft group">
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-brand-yellow/10 rounded-full blur-[80px] pointer-events-none transition-transform duration-700 group-hover:scale-125" />
                <div className="relative z-10 max-w-lg">
                  <h4 className="font-heading text-3xl md:text-4xl text-white mb-3 tracking-tight">Vive esta experiencia</h4>
                  <p className="text-white/80 font-light text-base md:text-lg leading-relaxed">Nuestros expertos locales te llevan a descubrir los rincones de los que hablamos en este artículo.</p>
                </div>
                <div className="relative z-10 shrink-0">
                  <Button asChild className="bg-brand-yellow text-brand-dark hover:bg-white rounded-full px-10 py-7 font-bold uppercase text-xs tracking-widest transition-transform hover:-translate-y-1 shadow-pop">
                    <Link href="/tours">Explorar Tours <ChevronRight className="ml-2 h-5 w-5" /></Link>
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