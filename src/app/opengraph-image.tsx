/* eslint-disable @next/next/no-img-element */
// src/app/opengraph-image.tsx  (o el archivo donde lo tengas)
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'KCE — Experiencias únicas';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Si quieres cache control, puedes añadir:
// export const revalidate = 60 * 60 * 24; // 24h

function getBaseUrl() {
  const explicit = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  const vercel = (process.env.VERCEL_URL || '').trim();
  if (vercel) return `https://${vercel}`.replace(/\/+$/, '');

  return 'http://localhost:3000';
}

function toBase64(bytes: Uint8Array) {
  // Edge-safe base64 (sin Buffer)
  let bin = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  // btoa existe en Edge
  return btoa(bin);
}

async function loadPngAsDataUri(url: string) {
  const r = await fetch(url, { cache: 'force-cache' });
  if (!r.ok) throw new Error(`logo_fetch_${r.status}`);
  const ab = await r.arrayBuffer();
  const b64 = toBase64(new Uint8Array(ab));
  return `data:image/png;base64,${b64}`;
}

export default async function Image() {
  const BASE = getBaseUrl();
  const LOGO_URL = `${BASE}/logo.png`;

  // Preferimos data URI para que no falle el render del OG si el fetch remoto se bloquea/intermitente.
  // Si falla, hacemos fallback al URL directo.
  let logoSrc = LOGO_URL;
  try {
    logoSrc = await loadPngAsDataUri(LOGO_URL);
  } catch {
    // fallback: URL directo
  }

  return new ImageResponse(
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'stretch',
        background: '#0D5BA1',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
      }}
    >
      {/* Backdrop gradiente */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #0D5BA1 0%, #063B69 60%)',
        }}
      />

      {/* Beam amarillo difuminado */}
      <div
        style={{
          position: 'absolute',
          top: -120,
          right: -120,
          width: 520,
          height: 520,
          background: '#FFC300',
          opacity: 0.14,
          filter: 'blur(60px)',
          borderRadius: 9999,
        }}
      />

      {/* Grid sutil */}
      <svg
        width="1200"
        height="630"
        style={{ position: 'absolute', inset: 0, opacity: 0.08 }}
      >
        <defs>
          <pattern
            id="grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="#FFF5E1"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect
          width="1200"
          height="630"
          fill="url(#grid)"
        />
      </svg>

      {/* Contenido */}
      <div
        style={{
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 24,
          padding: 72,
          color: '#FFF5E1',
          width: '100%',
        }}
      >
        {/* Logo + marca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img
            src={logoSrc}
            alt=""
            width={60}
            height={60}
            style={{
              borderRadius: 12,
              background: '#ffffff',
              padding: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,.25)',
              objectFit: 'contain',
            }}
          />
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 0.3 }}>
            Knowing Cultures Enterprise
          </div>
        </div>

        {/* Headline (Satori requiere display explícito cuando hay múltiples children) */}
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <span style={{ display: 'block', fontSize: 82, fontWeight: 800 }}>More than a trip,</span>
          <span
            style={{
              display: 'block',
              marginTop: 8,
              padding: '6px 14px',
              borderRadius: 12,
              background: 'rgba(255,195,0,.18)',
              fontSize: 80,
              fontWeight: 900,
            }}
          >
            a cultural awakening.
          </span>
        </div>

        {/* Subhead + dominio */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <div style={{ fontSize: 30, opacity: 0.95 }}>
            Experiencias únicas en Colombia — seguras, auténticas y memorables.
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>kce.travel</div>
        </div>
      </div>
    </div>,
    size,
  );
}

/* eslint-enable @next/next/no-img-element */
