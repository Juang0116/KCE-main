/* eslint-disable @next/next/no-img-element */
// src/app/(marketing)/tours/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'KCE — Tour';
// Next.js expects static literals for route config exports (no expressions).
export const revalidate = 3600; // 1h

type Params = { slug: string };

const ZERO_DECIMAL = new Set([
  'bif',
  'clp',
  'djf',
  'gnf',
  'jpy',
  'kmf',
  'krw',
  'mga',
  'pyg',
  'rwf',
  'ugx',
  'vnd',
  'vuv',
  'xaf',
  'xof',
  'xpf',
]);

function safeText(v: unknown) {
  return typeof v === 'string' ? v.trim() : '';
}

function truncate(text: unknown, max = 72) {
  const t = safeText(text);
  if (!t) return '';
  return t.length > max ? `${t.slice(0, Math.max(0, max - 1)).trimEnd()}…` : t;
}

function baseUrl() {
  const explicit = safeText(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL);
  const vercel = safeText(process.env.VERCEL_URL);
  const raw = explicit || (vercel ? `https://${vercel}` : '') || 'http://localhost:3000';
  return raw.replace(/\/+$/, '');
}

function isHttpUrl(s: string) {
  return s.startsWith('http://') || s.startsWith('https://');
}

function absoluteUrl(pathOrUrl: unknown) {
  const v = safeText(pathOrUrl);
  if (!v) return '';
  if (v.startsWith('javascript:') || v.startsWith('data:')) return '';
  if (isHttpUrl(v)) return v;
  const b = baseUrl();
  return `${b}${v.startsWith('/') ? '' : '/'}${v}`;
}

function pickImage(images: unknown) {
  // supports:
  // - [{ url, alt }] | ["https://..."] | "https://..." | null
  const img: any = images;

  const url =
    (Array.isArray(img) && typeof img[0] === 'string' && img[0]) ||
    (Array.isArray(img) && typeof img[0]?.url === 'string' && img[0].url) ||
    (typeof img === 'string' ? img : '');

  // fallback consistente del sitio
  return absoluteUrl(url) || absoluteUrl('/images/hero-kce.jpg') || `${baseUrl()}/images/hero-kce.jpg`;
}

function formatMoney(minor: unknown, currency: unknown, locale = 'es-ES') {
  const cur = (safeText(currency) || 'EUR').toUpperCase();
  const n = typeof minor === 'number' ? minor : Number.parseInt(String(minor ?? '0'), 10);
  const isZero = ZERO_DECIMAL.has(cur.toLowerCase());
  const value = Number.isFinite(n) ? (isZero ? n : n / 100) : 0;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: isZero ? 0 : 2,
      minimumFractionDigits: isZero ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toFixed(isZero ? 0 : 2)} ${cur}`;
  }
}

async function fetchTour(slug: string) {
  const supabaseUrl = safeText(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, '');
  const anonKey = safeText(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!supabaseUrl || !anonKey || !slug) return null;

  // Armamos el endpoint con URLSearchParams (evita encoding raro)
  const u = new URL(`${supabaseUrl}/rest/v1/tours`);
  u.searchParams.set('select', 'id,slug,title,city,currency,price_minor,images');
  u.searchParams.set('slug', `eq.${slug}`);
  u.searchParams.set('limit', '1');

  const r = await fetch(u.toString(), {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: 'application/json',
    },
    // caching controlado por export revalidate + next.revalidate
    cache: 'force-cache',
    next: { revalidate },
  });

  if (!r.ok) return null;

  const data = (await r.json()) as any[];
  return data?.[0] || null;
}

export default async function Image({ params }: { params: Params }) {
  const slug = safeText(params?.slug);
  const tour = await fetchTour(slug);

  const title = truncate(tour?.title ?? 'Knowing Cultures Enterprise', 64) || 'Knowing Cultures Enterprise';

  const city = truncate(tour?.city ?? 'Colombia', 28) || 'Colombia';
  const priceMinor = tour?.price_minor ?? 0;
  const currency = safeText(tour?.currency || 'EUR') || 'EUR';

  const subtitle = tour
    ? `${city} • ${formatMoney(priceMinor, currency)}`
    : 'Experiencias en Colombia';

  const imgUrl = pickImage(tour?.images);
  const domain = baseUrl().replace(/^https?:\/\//, '');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          overflow: 'hidden',
          background: '#070A13',
          color: '#FFFFFF',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
        }}
      >
        {/* Background image */}
        <img
          src={imgUrl}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.78,
            filter: 'saturate(1.05) contrast(1.05)',
          }}
        />

        {/* Overlays */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(1200px 630px at 15% 85%, rgba(11,78,224,.55), transparent 62%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(0,0,0,.86) 0%, rgba(0,0,0,.62) 55%, rgba(0,0,0,.40) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,.35) 40%, rgba(0,0,0,.70) 100%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 64,
            width: '100%',
          }}
        >
          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,.12)',
                  border: '1px solid rgba(255,255,255,.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  letterSpacing: -0.5,
                }}
              >
                KCE
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: 18, opacity: 0.92, fontWeight: 700 }}>Tour</div>
                <div style={{ fontSize: 14, opacity: 0.78 }}>{domain}</div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                borderRadius: 999,
                padding: '10px 14px',
                background: 'rgba(255,255,255,.10)',
                border: '1px solid rgba(255,255,255,.16)',
                fontSize: 14,
                fontWeight: 700,
                opacity: 0.95,
              }}
            >
              Más que un viaje • Un despertar cultural
            </div>
          </div>

          {/* Bottom block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                fontSize: 64,
                fontWeight: 900,
                lineHeight: 1.02,
                letterSpacing: -1.2,
                textShadow: '0 10px 30px rgba(0,0,0,.45)',
              }}
            >
              {title}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                flexWrap: 'wrap',
                fontSize: 26,
                fontWeight: 700,
                opacity: 0.93,
              }}
            >
              <span>{subtitle}</span>
              <span style={{ opacity: 0.55 }}>•</span>
              <span style={{ opacity: 0.85 }}>Reserva online</span>
            </div>

            <div
              style={{
                height: 1,
                width: 520,
                maxWidth: '100%',
                background: 'rgba(255,255,255,.20)',
                marginTop: 4,
              }}
            />

            <div style={{ fontSize: 18, opacity: 0.80 }}>
              {tour?.slug ? `kce.travel/tours/${tour.slug}` : 'kce.travel/tours'}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
/* eslint-enable @next/next/no-img-element */
