// next.config.ts
import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';
const isVercel = process.env.VERCEL === '1';

// We only emit strict HTTPS-only headers when we are actually behind HTTPS
// (e.g. Vercel or a SITE_URL that is explicitly https://...). This prevents
// LAN/localhost "next start" over http from breaking assets (CSS/JS/images)
// due to CSP upgrade-insecure-requests.
const siteUrlRaw = String(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim();
const enableHttpsOnlyHeaders = !isDev && (isVercel || siteUrlRaw.startsWith('https://'));

function tryHostname(raw?: string | null): string | null {
  const v = String(raw || '').trim();
  if (!v) return null;
  try {
    const url = v.startsWith('http') ? new URL(v) : new URL(`https://${v}`);
    return url.hostname;
  } catch {
    return null;
  }
}

const siteHost = tryHostname(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL) || null;
// Vercel exposes VERCEL_URL without protocol (e.g. myapp.vercel.app)
const vercelHost = tryHostname(process.env.VERCEL_URL) || null;
const supabaseHost = tryHostname(process.env.NEXT_PUBLIC_SUPABASE_URL) || null;

function pushOrigin(acc: string[], value?: string | null) {
  const raw = String(value || '').trim();
  if (!raw) return;
  const normalized = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `http://${raw}`;
  try {
    const origin = new URL(normalized).origin;
    if (!acc.includes(origin)) acc.push(origin);
  } catch {
    // ignore malformed origins from env
  }
}

function buildAllowedDevOrigins() {
  const values: string[] = [];
  const fromEnv = String(process.env.ALLOWED_DEV_ORIGINS || '').trim();
  const candidates = fromEnv
    ? fromEnv.split(',').map((x) => x.trim()).filter(Boolean)
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        // Ajusta esta IP o añade más por env: ALLOWED_DEV_ORIGINS=http://192.168.1.65:3000,http://192.168.1.120:3000
        'http://192.168.1.65:3000',
      ];

  for (const item of candidates) pushOrigin(values, item);

  if (siteUrlRaw.startsWith('http://')) pushOrigin(values, siteUrlRaw);
  if (vercelHost && isDev) pushOrigin(values, `https://${vercelHost}`);

  return values;
}

// PASO C: allow dev access from LAN origin(s) to avoid Next cross-origin dev warning.
// IMPORTANT: do NOT set this to undefined with exactOptionalPropertyTypes.
const devAllowedOrigins = buildAllowedDevOrigins();

function buildCSP() {
  // ▸ En dev añadimos 'unsafe-eval' y 'blob:' en script-src para que Next HMR no se rompa.
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://js.stripe.com',
    ...(isDev ? ["'unsafe-eval'", 'blob:'] : []),
  ];

  const styleSrc = [
    "'self'",
    "'unsafe-inline'",
    // con next/font no hace falta, pero no estorba:
    'https://fonts.googleapis.com',
  ];

  const imgSrc = [
    "'self'",
    'data:',
    'blob:',
    'https://images.unsplash.com',
    ...(supabaseHost ? [`https://${supabaseHost}`] : ['https://*.supabase.co']),
    ...(siteHost ? [`https://${siteHost}`] : ['https://kce.travel']),
    ...(vercelHost ? [`https://${vercelHost}`] : []),
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://chart.googleapis.com',
    'https://q.stripe.com', // pixel de Stripe
    // thumbnails/preview de YouTube
    'https://i.ytimg.com',
  ];

  const fontSrc = [
    "'self'",
    'data:',
    // con next/font normalmente no es necesario, pero lo dejamos por compat:
    'https://fonts.gstatic.com',
  ];

  const connectSrc = [
    "'self'",
    ...(supabaseHost ? [`https://${supabaseHost}`] : ['https://*.supabase.co']),
    'https://api.stripe.com',
    'https://checkout.stripe.com',
    'https://q.stripe.com',
    'https://api.openai.com',
    'https://generativelanguage.googleapis.com',
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    ...(vercelHost ? [`https://${vercelHost}`] : []),
    ...(isDev ? ['ws:', 'wss:', 'http://localhost:*', 'http://192.168.*:*'] : []),
  ];

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
    "frame-ancestors 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    `style-src ${styleSrc.join(' ')}`,
    `img-src ${imgSrc.join(' ')}`,
    `font-src ${fontSrc.join(' ')}`,
    `connect-src ${connectSrc.join(' ')}`,
    // Aunque usamos Checkout por redirección, permitimos estos por si
    // en el futuro usamos Payment Element/3DS:
    // Stripe + embebidos (YouTube/Vlog)
    `frame-src https://js.stripe.com https://checkout.stripe.com https://www.youtube.com https://www.youtube-nocookie.com`,
    `form-action 'self' https://checkout.stripe.com`,
    `worker-src 'self' blob:`,
    `media-src 'self' blob:`,
    // Only when we are truly on HTTPS.
    enableHttpsOnlyHeaders ? 'upgrade-insecure-requests' : '',
  ].filter(Boolean);

  return directives.join('; ');
}

// Extra typing to include allowedDevOrigins without TS complaining,
// while keeping NextConfig as base.
type NextConfigWithAllowedDevOrigins = NextConfig & {
  allowedDevOrigins?: string[];
};

const nextConfig: NextConfigWithAllowedDevOrigins = {
  // Avoid Next.js inferring an incorrect workspace root when multiple lockfiles exist.
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // ✅ PASO C (sin romper exactOptionalPropertyTypes):
  ...(isDev ? { allowedDevOrigins: devAllowedOrigins } : {}),

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      ...(supabaseHost
        ? [{ protocol: 'https' as const, hostname: supabaseHost }]
        : [{ protocol: 'https' as const, hostname: '**.supabase.co' }]),
      ...(siteHost
        ? [{ protocol: 'https' as const, hostname: siteHost }]
        : [{ protocol: 'https' as const, hostname: 'kce.travel' }]),
      ...(vercelHost ? [{ protocol: 'https' as const, hostname: vercelHost }] : []),
      { protocol: 'https', hostname: 'chart.googleapis.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    const csp = buildCSP();
    const hsts = enableHttpsOnlyHeaders
      ? [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ]
      : [];

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
          },
          ...hsts,
        ],
      },
    ];
  },
};

export default nextConfig;
