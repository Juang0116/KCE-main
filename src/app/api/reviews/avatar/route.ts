// src/app/api/reviews/avatar/route.ts
import 'server-only';

import crypto from 'node:crypto';

import { NextResponse, type NextRequest } from 'next/server';

import { logEvent } from '@/lib/events.server';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 2_000_000; // 2MB

function safeStr(v: unknown) {
  return typeof v === 'string' ? v.trim() : '';
}

function extFromType(type: string) {
  const t = type.toLowerCase();
  if (t.includes('png')) return 'png';
  if (t.includes('webp')) return 'webp';
  if (t.includes('gif')) return 'gif';
  return 'jpg';
}

function publicUrlFor(path: string) {
  const supabaseUrl = safeStr(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!supabaseUrl) return null;
  return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/review_avatars/${path}`;
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const rl = await checkRateLimit(req, {
    action: 'reviews.upload_avatar',
    limit: 20,
    windowSeconds: 60 * 60,
    identity: 'ip+vid',
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests', requestId },
      { status: 429, headers: withRequestId(undefined, requestId) },
    );
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: 'Supabase admin not configured', requestId },
      { status: 503, headers: withRequestId(undefined, requestId) },
    );
  }

  try {
    const form = await req.formData();
    const tourSlug = safeStr(form.get('tour_slug'));
    const file = form.get('file');

    if (!tourSlug) {
      return NextResponse.json(
        { error: 'Missing tour_slug', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'Missing file', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    // Next / Web File
    const f = file as File;

    const mime = safeStr((f as any).type || '');
    if (!mime.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    if (typeof (f as any).size === 'number' && (f as any).size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'File too large (max 2MB)', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const buf = Buffer.from(await f.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: 'File too large (max 2MB)', requestId },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const ext = extFromType(mime);
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = crypto.randomBytes(8).toString('hex');
    const path = `${tourSlug}/${day}_${rand}.${ext}`;

    const up = await admin.storage.from('review_avatars').upload(path, buf, {
      contentType: mime,
      upsert: false,
    });

    if (up.error) throw new Error(up.error.message);

    const avatar_url = publicUrlFor(path);
    if (!avatar_url) {
      return NextResponse.json(
        { error: 'Supabase URL not configured', requestId },
        { status: 500, headers: withRequestId(undefined, requestId) },
      );
    }

    void logEvent('review_avatar_uploaded', {
      request_id: requestId,
      tour_slug: tourSlug,
      path,
      bytes: buf.byteLength,
    });

    return NextResponse.json(
      { ok: true, avatar_url, requestId },
      { headers: withRequestId(undefined, requestId) },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload error';
    void logEvent('api.error', {
      request_id: requestId,
      route: '/api/reviews/avatar',
      error: message,
    });
    return NextResponse.json(
      { error: message, requestId },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}
