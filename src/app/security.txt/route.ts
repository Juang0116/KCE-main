import 'server-only';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
// Cambiamos a 'force-static' para que Next.js lo genere en build time, 
// es un archivo que no cambia casi nunca.
export const dynamic = 'force-static';

/**
 * RFC 9116: El archivo debe contener un campo 'Expires' para ser válido.
 * Se recomienda actualizarlo al menos cada año.
 */
const body = `Contact: mailto:security@knowingcultures.com
Expires: 2027-01-01T00:00:00.000Z
Preferred-Languages: es, en, de
Policy: https://knowingcultures.com/terms
Acknowledgments: https://knowingcultures.com
Hiring: https://knowingcultures.com
`;

export function GET() {
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // Cache de larga duración (24h) ya que es estático
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}