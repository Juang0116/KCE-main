import 'server-only';

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

const body = `Contact: mailto:security@knowingcultures.com
Preferred-Languages: es,en,de
Policy: https://knowingcultures.com/terms
Acknowledgments: https://knowingcultures.com
Hiring: https://knowingcultures.com
`;

export function GET() {
  return new NextResponse(body, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
