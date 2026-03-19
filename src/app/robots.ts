import type { MetadataRoute } from 'next';

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  'https://kce.travel'
).replace(/\/+$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/', 
          '/tours/', // Queremos máxima indexación aquí
          '/about', 
          '/contact',
          '/blog'
        ],
        disallow: [
          '/api/',        // Rutas internas de datos
          '/admin/',      // Panel de administración
          '/account/',    // Datos privados de usuario
          '/go/',         // Redirecciones de pago/checkout (crucial)
          '/review-demo', // La página de pruebas que armamos
          '/booking/*',   // Detalles de reservas específicas (privado)
          '/*?*',         // Evita indexar variaciones de búsqueda con query params
        ],
      },
      {
        // Bloqueamos específicamente a bots conocidos por scrapear contenido para IA 
        // si prefieres mantener la exclusividad de tus textos curados.
        userAgent: ['GPTBot', 'CCBot'],
        disallow: ['/'],
      }
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}