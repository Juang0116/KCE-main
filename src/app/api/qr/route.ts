// src/app/api/qr/route.ts
import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import QRCode from 'qrcode';

import { jsonError } from '@/lib/apiErrors';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const url = new URL(req.url);
  const text = (url.searchParams.get('text') || url.searchParams.get('url') || '').trim();

  if (!text) {
    return jsonError(req, {
      status: 400,
      code: 'INVALID_INPUT',
      message: 'Missing ?text=',
      requestId,
    });
  }

  const png = await QRCode.toBuffer(text, {
    type: 'png',
    width: 512,
    margin: 1,
    errorCorrectionLevel: 'M',
  });

  // NextResponse espera BodyInit (Uint8Array OK). Buffer a veces falla en TS.
  const body = new Uint8Array(png);

  return new NextResponse(body, {
    status: 200,
    headers: withRequestId(
      {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
      requestId,
    ) as Record<string, string>,
  });
}
