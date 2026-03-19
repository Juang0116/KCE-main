import type { MetadataRoute } from 'next';

/**
 * Genera el manifiesto de la PWA (Progressive Web App).
 * Se sirve en /manifest.webmanifest (Next.js default) 
 * y en /site.webmanifest (vía nuestro alias en route.ts).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Knowing Cultures Enterprise',
    short_name: 'KCE',
    description: 'Colombia auténtica, segura y transformadora. Tours culturales en Bogotá, Caldas y Cartagena.',
    
    id: '/',
    scope: '/',
    start_url: '/?utm_source=pwa&utm_medium=pwa_app',

    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'window-controls-overlay'],

    // Colores sincronizados con branding/brand.tokens
    background_color: '#FFF5E1', // Light surface
    theme_color: '#0D5BA1',      // KCE Blue principal

    lang: 'es-CO',
    dir: 'ltr',
    orientation: 'portrait-primary',
    categories: ['travel', 'tourism', 'culture'],
    prefer_related_applications: false,

    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png', // Recomendado: versión con padding para Android
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],

    shortcuts: [
      {
        name: 'Explorar tours',
        short_name: 'Tours',
        description: 'Ver catálogo de experiencias disponibles',
        url: '/tours',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Hablar con KCE Assistant',
        short_name: 'Chat IA',
        description: 'Asistencia inteligente para tu viaje',
        url: '/?chat=open',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}