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
    <main className="min-h-screen bg-[#FDFCFB] pb-32 animate-fade-in">
      
      {/* BRANDING KCE FORZADO: Texto nítido y elegante */}
      <style dangerouslySetInnerHTML={{ __html: `
        .prose-kce p, .prose-kce li { 
          color: #1A202C !important; 
          opacity: 0.9 !important;
          line-height: 1.85 !important;
          margin-bottom: 1.5rem !important;
        }
        .prose-kce h2, .prose-kce h3 { 
          color: #004A7C !important; /* Azul KCE */
          font-weight: 700 !important;
          margin-top: 3rem !important;
        }
        .prose-kce strong { 
          color: #000 !important; 
          font-weight: 700 !important;
        }
        .prose-kce blockquote {
          border-left: 4px solid #F5A623 !important; /* Amarillo KCE */
          background: #F7FAFC !important;
          padding: 2rem !important;
          border-radius: 0 1rem 1rem 0 !important;
        }
        .prose-kce blockquote p {
          color: #004A7C !important;
          font-size: 1.5rem !important;
          font-style: italic !important;
        }
      `}} />

      {/* 01. NAVIGATION */}
      <nav className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-100 py-4">
        <div className="mx-auto max-w-5xl px-6 flex justify-between items-center">
          <Link href="/blog" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#004A7C] hover:text-[#F5A623] transition-all group">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" /> 
            Revista KCE
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hidden md:block">Knowing Cultures Enterprise</span>
            <Share2 className="h-4 w-4 text-slate-400 cursor-pointer hover:text-[#004A7C]" />
          </div>
        </div>
      </nav>

      {/* 02. COVER */}
      {item.cover_url && (
        <div className="relative w-full h-[65vh] overflow-hidden bg-slate-900">
          <img src={item.cover_url} alt={item.title} className="h-full w-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#FDFCFB]" />
        </div>
      )}

      {/* 03. ARTICLE */}
      <article className={`mx-auto max-w-4xl px-6 ${item.cover_url ? '-mt-32 md:-mt-48' : 'pt-24'} relative z-10`}>
        <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-8 md:px-20 py-16 md:py-24">
            
            <header className="mb-16 text-center">
              <div className="mb-8 flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#F5A623]">
                <BookOpen className="h-4 w-4" />
                <span>Crónica de Viaje</span>
                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                <span className="text-slate-400">{readingTime} MIN READ</span>
              </div>
              
              <h1 className="font-heading text-4xl md:text-6xl text-[#004A7C] leading-tight mb-10 tracking-tight">
                {item.title}
              </h1>

              {item.excerpt && (
                <p className="text-xl md:text-2xl font-light leading-relaxed text-slate-500 italic max-w-2xl mx-auto">
                  "{item.excerpt}"
                </p>
              )}
            </header>

            <div className="prose prose-lg md:prose-xl max-w-none mx-auto prose-kce font-sans">
              <Markdown content={item.content_md} />
            </div>

            {/* CTA FOOTER */}
            <footer className="mt-20 pt-16 border-t border-slate-100">
              <div className="bg-[#004A7C] p-10 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                  <h4 className="font-heading text-2xl mb-2">Vive esta experiencia</h4>
                  <p className="text-blue-100 font-light text-sm">Nuestros expertos locales te llevan a descubrir estos rincones.</p>
                </div>
                <Button asChild className="bg-[#F5A623] text-[#004A7C] hover:bg-white rounded-full px-8 h-12 font-bold uppercase text-[10px] tracking-widest transition-colors">
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