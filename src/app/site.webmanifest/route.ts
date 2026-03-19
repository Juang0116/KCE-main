import 'server-only';
import { NextResponse } from 'next/server';
// Importamos la función que genera el manifiesto
import manifest from '../manifest';

export const runtime = 'nodejs';
// Al ser un alias del manifiesto principal, podemos forzarlo como estático
export const dynamic = 'force-static';

export async function GET() {
  // Obtenemos los datos del manifiesto base
  const data = manifest();

  return NextResponse.json(data, {
    status: 200,
    headers: {
      // El MIME type correcto según el estándar W3C
      'Content-Type': 'application/manifest+json; charset=utf-8',
      // Cache-control agresivo para PWA, pero con validación obligatoria
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

// El método HEAD es útil para validadores que solo chequean la existencia del archivo
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}