// src/features/reviews/ReviewsList.tsx
import 'server-only';

import Image from 'next/image';

import { getSupabasePublic, isSupabasePublicConfigured } from '@/lib/supabasePublic';

type Props = { tourSlug?: string; limit?: number };

type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  comment: string | null; // legacy
  customer_name: string | null;
  avatar_url: string | null;
  media_urls: string[] | null;
  face_consent: boolean | null;
  status: string | null;
  published_at: string | null;
  created_at: string | null;
};

function stars(n: number) {
  const v = Math.max(0, Math.min(5, Math.round(Number.isFinite(n) ? n : 0)));
  return '★★★★★'.slice(0, v) + '☆☆☆☆☆'.slice(0, 5 - v);
}

export async function ReviewsList({ tourSlug, limit = 10 }: Props) {
  if (!isSupabasePublicConfigured()) return null;

  const supabase = getSupabasePublic();

  let q = supabase
    .from('reviews')
    .select(
      'id,rating,title,body,comment,customer_name,avatar_url,media_urls,face_consent,status,published_at,created_at',
    )
    .eq('status', 'approved'); // ✅ estándar único

  if (tourSlug) q = q.eq('tour_slug', tourSlug);

  const { data, error } = await q
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return null;

  const items = (data ?? []) as ReviewRow[];
  if (!items.length) return null;

  return (
    <section className="mt-10 rounded-2xl border border-brand-dark/10 bg-[color:var(--color-surface)] p-6 shadow-soft">
      <h2 className="font-heading text-lg text-brand-blue">Reseñas</h2>

      <ul className="mt-4 space-y-4">
        {items.map((r) => {
          const body = (r.body || r.comment || '').trim();
          const name = r.customer_name || 'Cliente';
          const rating = Number.isFinite(r.rating) ? r.rating : 0;

          return (
            <li
              key={r.id}
              className="rounded-xl bg-black/5 p-4"
            >
              <div className="flex items-start gap-3">
                {r.avatar_url ? (
                  <Image
                    src={r.avatar_url}
                    alt={name}
                    width={40}
                    height={40}
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="size-10 rounded-full bg-black/10"
                    aria-hidden
                  />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium text-[color:var(--color-text)]">{name}</div>
                    <div
                      className="text-[color:var(--color-text)]/70 text-xs"
                      aria-label={`${rating} estrellas`}
                    >
                      {stars(rating)}
                    </div>
                  </div>

                  {r.title ? (
                    <div className="mt-1 text-sm font-semibold text-[color:var(--color-text)]">
                      {r.title}
                    </div>
                  ) : null}
                  {body ? (
                    <p className="text-[color:var(--color-text)]/80 mt-2 text-sm">{body}</p>
                  ) : null}

                  {Boolean(r.face_consent) &&
                  Array.isArray(r.media_urls) &&
                  r.media_urls.length > 0 ? (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {r.media_urls.slice(0, 4).map((url, idx) => (
                        <div
                          key={`${r.id}-m-${idx}`}
                          className="relative aspect-square overflow-hidden rounded-xl bg-black/10"
                        >
                          <Image
                            src={url}
                            alt={`Foto ${idx + 1} — ${name}`}
                            fill
                            sizes="(min-width: 640px) 140px, 45vw"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
