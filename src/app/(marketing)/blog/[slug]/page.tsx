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
    <main className="min-h-screen bg-[color:var(--color-bg)] pb-32 animate-fade-in">
      
      {/* BRANDING KCE FORZADO: Texto nítido y elegante */}
      <style dangerouslySetInnerHTML={{ __html: `
        .prose-kce p, .prose-kce li { 
          color: var(--brand-dark) !important; 
          opacity: 0.9 !important;
          line-height: 1.85 !important;
          margin-bottom: 1.5rem !important;
        }
        .prose-kce h2, .prose-kce h3 { 
          color: var(--brand-blue) !important; /* Azul KCE */
          font-weight: 700 !important;
          margin-top: 3rem !important;
        }
        .prose-kce strong { 
          color: #000 !important; 
          font-weight: 700 !important;
        }
        .prose-kce blockquote {
          border-left: 4px solid var(--brand-yellow) !important; /* Amarillo KCE */
          background: var(--color-surface) !important;
          padding: 2rem !important;
          border-radius: 0 1rem 1rem 0 !important;
        }
        .prose-kce blockquote p {
          color: var(--brand-blue) !important;
          font-size: 1.5rem !important;
          font-style: italic !important;
        }
      `}} />

      {/* 01. NAVIGATION */}
      <nav className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[color:var(--color-border)] py-4">
        <div className="mx-auto max-w-5xl px-6 flex justify-between items-center">
          <Link href="/blog" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue hover:text-brand-yellow transition-all group">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" /> 
            Revista KCE
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[color:var(--color-text-muted)] hidden md:block">Knowing Cultures Enterprise</span>
            <Share2 className="h-4 w-4 text-[color:var(--color-text-muted)] cursor-pointer hover:text-brand-blue" />
          </div>
        </div>
      </nav>

      {/* 02. COVER */}
      {item.cover_url && (
        <div className="relative w-full h-[65vh] overflow-hidden bg-brand-dark">
          <img src={item.cover_url} alt={item.title} className="h-full w-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--color-bg)]" />
        </div>
      )}

      {/* 03. ARTICLE */}
      <article className={`mx-auto max-w-4xl px-6 ${item.cover_url ? '-mt-32 md:-mt-48' : 'pt-24'} relative z-10`}>
        <div className="bg-white border border-[color:var(--color-border)] rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-8 md:px-20 py-16 md:py-24">
            
            <header className="mb-16 text-center">
              <div className="mb-8 flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-yellow">
                <BookOpen className="h-4 w-4" />
                <span>Crónica de Viaje</span>
                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                <span className="text-[color:var(--color-text-muted)]">{readingTime} MIN READ</span>
              </div>
              
              <h1 className="font-heading text-4xl md:text-6xl text-brand-blue leading-tight mb-10 tracking-tight">
                {item.title}
              </h1>

              {item.excerpt && (
                <p className="text-xl md:text-2xl font-light leading-relaxed text-[color:var(--color-text-muted)] italic max-w-2xl mx-auto">
                  "{item.excerpt}"
                </p>
              )}
            </header>

            <div className="prose prose-lg md:prose-xl max-w-none mx-auto prose-kce font-sans">
              <Markdown content={item.content_md} />
            </div>

            {/* CTA FOOTER */}
            <footer className="mt-20 pt-16 border-t border-[color:var(--color-border)]">
              <div className="bg-brand-blue p-10 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                  <h4 className="font-heading text-2xl mb-2">Vive esta experiencia</h4>
                  <p className="text-blue-100 font-light text-sm">Nuestros expertos locales te llevan a descubrir estos rincones.</p>
                </div>
                <Button asChild className="bg-brand-yellow text-brand-blue hover:bg-white rounded-full px-8 h-12 font-bold uppercase text-[10px] tracking-widest transition-colors">
                  <Link href="/tours">Explorar Tours <ChevronRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </footer>
          </div>
        </div>
      </article>
    </main>
  );
}