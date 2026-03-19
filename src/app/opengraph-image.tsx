/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';

// Configuración de ejecución en el Edge para máxima velocidad
export const runtime = 'edge';
export const alt = 'Knowing Cultures Enterprise — More than a trip';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function getBaseUrl() {
  const explicit = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const vercel = (process.env.VERCEL_URL || '').trim();
  if (vercel) return `https://${vercel}`.replace(/\/+$/, '');
  return 'http://localhost:3000';
}

/**
 * Convierte bytes a Base64 de forma segura en entornos Edge (donde Buffer no existe).
 */
function toBase64(bytes: Uint8Array) {
  let bin = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(bin);
}

async function loadPngAsDataUri(url: string) {
  try {
    const r = await fetch(url, { cache: 'force-cache' });
    if (!r.ok) return null;
    const ab = await r.arrayBuffer();
    const b64 = toBase64(new Uint8Array(ab));
    return `data:image/png;base64,${b64}`;
  } catch (e) {
    return null;
  }
}

export default async function Image() {
  const BASE = getBaseUrl();
  // Buscamos el logo en la carpeta public
  const logoSrc = await loadPngAsDataUri(`${BASE}/brand/logo-square.png`) ?? `${BASE}/brand/logo.png`;

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        backgroundColor: '#0D5BA1', // Azul KCE
        backgroundImage: 'linear-gradient(135deg, #0D5BA1 0%, #063B69 100%)',
        color: '#FFF5E1', // Crema KCE
        fontFamily: 'sans-serif',
      }}
    >
      {/* Grid decorativo sutil */}
      <svg
        width="1200"
        height="630"
        style={{ position: 'absolute', top: 0, left: 0, opacity: 0.1 }}
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FFF5E1" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1200" height="630" fill="url(#grid)" />
      </svg>

      {/* Brillo amarillo (Sun beam) */}
      <div
        style={{
          position: 'absolute',
          top: -150,
          right: -150,
          width: 600,
          height: 600,
          background: 'rgba(255, 195, 0, 0.15)',
          borderRadius: 999,
          filter: 'blur(100px)',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          height: '100%',
          padding: '0 80px',
          gap: 32,
        }}
      >
        {/* Badge superior */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img
            src={logoSrc}
            alt="KCE Logo"
            width="70"
            height="70"
            style={{
              borderRadius: 16,
              backgroundColor: '#FFF5E1',
              padding: 10,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            }}
          />
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '0.05em' }}>
            KNOWING CULTURES
          </div>
        </div>

        {/* Headline principal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 90, fontWeight: 800, lineHeight: 1 }}>
            More than a trip,
          </div>
          <div 
            style={{ 
              fontSize: 84, 
              fontWeight: 900, 
              color: '#FFC300', // Amarillo Marca
              backgroundColor: 'rgba(255,195,0,0.1)',
              padding: '0 20px',
              borderRadius: 20,
              alignSelf: 'flex-start'
            }}
          >
            a cultural awakening.
          </div>
        </div>

        {/* Footer info */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-end',
            marginTop: 40,
            borderTop: '1px solid rgba(255,245,225,0.2)',
            paddingTop: 32
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 400, opacity: 0.9, maxWidth: 600 }}>
            Experiencias únicas en Colombia: Seguras, auténticas y memorables.
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#FFC300' }}>
            kce.travel
          </div>
        </div>
      </div>
    </div>,
    { ...size }
  );
}