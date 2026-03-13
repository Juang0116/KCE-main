// src/app/(marketing)/blog/[slug]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { Markdown } from '@/components/Markdown';
import { getPublishedPostBySlug } from '@/features/content/content.server';
import { SITE_URL } from '@/lib/env';

export const revalidate = 600;

function baseUrl() {
  return (SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

// Si tu app usa /es/blog, etc, entonces el link debería ser relativo (sin host) y con locale.
// Aquí lo mantenemos simple: relativo.
function blogIndexHref() {
  return '/blog';
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
    title: `${item.title} | KCE`,
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

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { item } = await getPublishedPostBySlug(slug);

  if (!item) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link
          href={blogIndexHref()}
          className="text-sm text-[color:var(--color-text)]/70 underline underline-offset-4 hover:text-[color:var(--color-text)]"
        >
          ← Volver al blog
        </Link>
      </div>

      {item.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.cover_url}
          alt={item.title}
          className="mb-6 h-64 w-full rounded-2xl object-cover"
          loading="lazy"
        />
      ) : null}

      <header className="mb-6 space-y-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-[color:var(--color-text)]">
          {item.title}
        </h1>

        {item.excerpt ? (
          <p className="text-[color:var(--color-text)]/75">{item.excerpt}</p>
        ) : null}

        {(item.tags ?? []).length ? (
          <div className="flex flex-wrap gap-2">
            {(item.tags ?? []).map((tag: string) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-0.5 text-xs text-[color:var(--color-text)]/80"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <article className="prose prose-neutral max-w-none dark:prose-invert">
        <Markdown content={item.content_md} />
      </article>
    </main>
  );
}
