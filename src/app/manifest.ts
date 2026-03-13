// src/app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Knowing Cultures Enterprise',
    short_name: 'KCE',
    description:
      'Colombia auténtica, segura y transformadora. Tours culturales en Bogotá, Caldas y Cartagena.',

    id: '/',
    scope: '/',
    start_url: '/?source=pwa',

    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'browser'],

    // Mantén consistencia con el layout:
    // - background_color: el fondo “light”
    // - theme_color: puedes usar el azul marca o sincronizarlo con themeColor del layout
    background_color: '#FFF5E1',
    theme_color: '#0D5BA1',

    lang: 'es-CO',
    dir: 'ltr',
    orientation: 'portrait-primary',
    categories: ['travel', 'tourism', 'culture'],
    prefer_related_applications: false,

    // Opcional pero útil para PWA: screenshots (si los tienes)
    // screenshots: [{ src: '/screenshots/1.png', sizes: '1080x1920', type: 'image/png' }],

    icons: [
      // 192x192 (any + maskable)
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },

      // 512x512 (any + maskable)
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],

    shortcuts: [
      {
        name: 'Explorar tours',
        short_name: 'Tours',
        url: '/tours',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Hablar con IA',
        short_name: 'Chat IA',
        url: '/?chat=open',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],

    // Opcional: si quieres declarar el origen del sitio (no es requerido en manifest)
    // related_applications: [],
  };
}
