// src/features/reviews/FeaturedReviews.tsx
import 'server-only';

import Image from 'next/image';
import Link from 'next/link';

import { getSupabasePublicOptional } from '@/lib/supabasePublic';
import { listTours } from '@/features/tours/catalog.server';
import { toTourLike } from '@/features/tours/adapters';

type Props = {
  locale: 'es' | 'en' | 'fr' | 'de';
  limit?: number;
};

type ReviewRow = {
  id: string;
  tour_slug: string;
  rating: number;
  title: string | null;
  body: string | null;
  customer_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

function withLocale(locale: string, href: string) {
  if (!href.startsWith('/')) return href;
  if (href === '/') return `/${locale}`;
  return `/${locale}${href}`;
}

function safeStr(v?: string | null) {
  return (v ?? '').trim();
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' });
}

function initials(name: string) {
  const parts = name.split(' ').filter(Boolean);
  const a = parts[0]?.[0] ?? 'K';
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
  return (a + b).toUpperCase();
}

export default async function FeaturedReviews({ locale, limit = 6 }: Props) {
  const sb = getSupabasePublicOptional();
  if (!sb) return null;

  const [{ items: tours }, { data, error }] = await Promise.all([
    listTours({ sort: 'popular', limit: 80 }),
    sb
      .from('reviews')
      .select('id,tour_slug,rating,title,body,customer_name,avatar_url,created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  if (error || !data || data.length === 0) return null;

  const mapTitle = new Map<string, string>();
  for (const t of tours) {
    const ui = toTourLike(t);
    mapTitle.set(ui.slug, ui.title);
  }

  const rows = data as ReviewRow[];

  return (
    <section
      aria-label="Reseñas destacadas"
      className="card p-6"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl text-brand-blue">Lo que dicen nuestros viajeros</h2>
          <p className="text-[color:var(--color-text)]/75 mt-2 text-sm">
            Reseñas reales (aprobadas) para que reserves con confianza.
          </p>
        </div>

        <Link
          href={withLocale(locale, '/tours')}
          className="hidden text-sm font-semibold text-[color:var(--brand-blue)] underline-offset-4 hover:underline md:inline-block"
        >
          Ver tours →
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => {
          const name = safeStr(r.customer_name) || 'Viajero KCE';
          const tourTitle = mapTitle.get(r.tour_slug) || r.tour_slug;
          const date = fmtDate(r.created_at);

          return (
            <article
              key={r.id}
              className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-[color:var(--color-border)] bg-black/5">
                    {safeStr(r.avatar_url) ? (
                      <Image
                        src={safeStr(r.avatar_url)}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="text-[color:var(--color-text)]/70 flex size-full items-center justify-center text-xs font-semibold">
                        {initials(name)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[color:var(--color-text)]">
                      {name}
                    </p>
                    <p className="text-[color:var(--color-text)]/60 mt-0.5 truncate text-xs">
                      {tourTitle}
                      {date ? <span className="opacity-60"> • {date}</span> : null}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-[color:var(--color-text)]">
                  ⭐ {Number(r.rating || 0).toFixed(1)}
                </div>
              </div>

              {r.title ? (
                <p className="mt-3 text-sm font-semibold text-[color:var(--color-text)]">
                  {r.title}
                </p>
              ) : null}

              <p className="text-[color:var(--color-text)]/75 mt-2 line-clamp-4 text-sm">
                {r.body || ''}
              </p>

              <div className="mt-4">
                <Link
                  href={withLocale(locale, `/tours/${r.tour_slug}#reviews`)}
                  className="text-sm font-semibold text-[color:var(--brand-blue)] underline-offset-4 hover:underline"
                >
                  Ver tour →
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-6 md:hidden">
        <Link
          href={withLocale(locale, '/tours')}
          className="text-sm font-semibold text-[color:var(--brand-blue)] underline-offset-4 hover:underline"
        >
          Ver tours →
        </Link>
      </div>
    </section>
  );
}
