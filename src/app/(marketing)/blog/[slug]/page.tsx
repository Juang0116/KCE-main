import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { Markdown } from '@/components/Markdown';
import { getPublishedPostBySlug } from '@/features/content/content.server';
import { SITE_URL } from '@/lib/env';

export const revalidate = 600;

function baseUrl() {
  return (SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
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

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { item } = await getPublishedPostBySlug(slug);

  if (!item) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 pb-32">
      <Link href="/blog" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text)]/40 hover:text-brand-blue transition-colors mb-10">
        <ArrowLeft className="h-3 w-3" /> Volver al Blog
      </Link>

      <article className="rounded-[3rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm overflow-hidden">
        {item.cover_url && (
          <div className="relative aspect-video w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.cover_url} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] to-transparent"></div>
          </div>
        )}

        <div className={`px-8 md:px-16 pb-16 ${item.cover_url ? '-mt-24 relative z-10' : 'pt-16'}`}>
          <header className="mb-12 text-center">
            {(item.tags ?? []).length > 0 && (
              <div className="mb-6 flex flex-wrap justify-center gap-2">
                {(item.tags ?? []).map((tag: string) => (
                  <span key={tag} className="rounded-full border border-brand-blue/20 bg-brand-blue/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-blue shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl text-[var(--color-text)] leading-tight mb-6">
              {item.title}
            </h1>

            {item.excerpt && (
              <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-[var(--color-text)]/70">
                {item.excerpt}
              </p>
            )}
          </header>

          <div className="prose prose-lg prose-slate max-w-none mx-auto font-light leading-relaxed text-[var(--color-text)]/80 prose-headings:font-heading prose-headings:text-brand-blue prose-a:text-brand-blue hover:prose-a:underline prose-img:rounded-3xl prose-img:shadow-md">
            <Markdown content={item.content_md} />
          </div>
        </div>
      </article>
    </main>
  );
}