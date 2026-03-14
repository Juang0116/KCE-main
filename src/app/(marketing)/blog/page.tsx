// src/app/(marketing)/blog/page.tsx
import Link from 'next/link';

import { listPublishedPosts } from '@/features/content/content.server';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | KCE',
  description: 'Historias, guías y datos curiosos sobre Colombia.',
  robots: { index: true, follow: true },
};



export const revalidate = 600;

export default async function BlogIndexPage() {
  const { items } = await listPublishedPosts({ limit: 24 });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="mb-8 space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-[color:var(--color-text)]">
          Blog
        </h1>
        <p className="text-[color:var(--color-text)]/70">
          Historias, datos curiosos y guías para que vivas Colombia como un local.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-6 text-[color:var(--color-text)]/70">
          Aún no hay publicaciones. Vuelve pronto.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group rounded-2xl border border-[var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft transition hover:shadow-md"
            >
              <div className="space-y-3">
                {p.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.cover_url}
                    alt={p.title}
                    className="h-40 w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : null}

                <div className="space-y-1">
                  <h2 className="font-heading text-lg font-semibold tracking-tight text-[color:var(--color-text)] group-hover:underline">
                    {p.title}
                  </h2>
                  {p.excerpt ? (
                    <p className="text-sm text-[color:var(--color-text)]/70">{p.excerpt}</p>
                  ) : null}
                </div>

                {(p.tags ?? []).length ? (
                  <div className="flex flex-wrap gap-2">
                    {(p.tags ?? []).slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-0.5 text-xs text-[color:var(--color-text)]/75"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
