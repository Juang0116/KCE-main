/* eslint-disable @next/next/no-img-element */
// src/app/(marketing)/tours/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'KCE — Tour Premium';
// Next.js expects static literals for route config exports
export const revalidate = 3600; // 1h

type Params = { slug: string };

const ZERO_DECIMAL = new Set([
  'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 
  'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
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
  const img: any = images;
  const url =
    (Array.isArray(img) && typeof img[0] === 'string' && img[0]) ||
    (Array.isArray(img) && typeof img[0]?.url === 'string' && img[0].url) ||
    (typeof img === 'string' ? img : '');
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

  const title = truncate(tour?.title ?? 'Colección de Tours KCE', 64) || 'Colección de Tours KCE';
  const city = truncate(tour?.city ?? 'Colombia', 28) || 'Colombia';
  const priceMinor = tour?.price_minor ?? 0;
  const currency = safeText(tour?.currency || 'EUR') || 'EUR';

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
          background: '#0B1220', // brand-dark base
          color: '#FFFFFF',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        {/* Background image (Main Visual) */}
        <img
          src={imgUrl}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.9,
          }}
        />

        {/* Overlays: Simulando el Glassmorphism y la elegancia.
          Un gradiente oscuro desde abajo para leer el texto, y un destello Brand Blue. 
        */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(11,18,32,0) 0%, rgba(11,18,32,0.4) 40%, rgba(11,18,32,0.95) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(1200px 800px at 0% 100%, rgba(13,91,161,0.6), transparent 100%)',
          }}
        />

        {/* Content Container */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px 72px',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Top Bar: Logo & Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            
            {/* Logo KCE Box Premium */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: '#0D5BA1', // Brand Blue
                  boxShadow: '0 8px 30px rgba(13,91,161,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 900,
                  letterSpacing: -1,
                  color: '#FFFFFF',
                }}
              >
                KCE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', letterSpacing: -0.5 }}>Kolombia Coffee Experience</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#FFC300', textTransform: 'uppercase', letterSpacing: 2 }}>{domain}</div>
              </div>
            </div>

            {/* Etiqueta Superior Derecha */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 20px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
              }}
            >
              Colección Premium
            </div>
          </div>

          {/* Bottom Block: Info Principal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Título Enorme */}
            <div
              style={{
                fontSize: 72,
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: -2,
                color: '#FFFFFF',
                textShadow: '0 10px 40px rgba(0,0,0,0.6)',
                maxWidth: '90%',
              }}
            >
              {title}
            </div>

            {/* Divider sutil */}
            <div style={{ height: 2, width: 100, background: '#FFC300', borderRadius: 2 }} />

            {/* Metadatos: Ciudad y Precio */}
            <div
              style={{
                display: 'flex',
                gap: 24,
                alignItems: 'center',
                fontSize: 28,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              {/* Ciudad con Icono SVG inline para asegurar renderizado Satori */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFC300" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>{city}</span>
              </div>
              
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
              
              {/* Precio */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#A87C51' }}>Desde</span> {/* Brand Terra */}
                <span style={{ fontWeight: 800, color: '#FFFFFF' }}>{formatMoney(priceMinor, currency)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    ),
    size,
  );
}
/* eslint-enable @next/next/no-img-element */