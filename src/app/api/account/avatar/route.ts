import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { supabaseServer } from '@/lib/supabase/server';
import { getRequestId, withRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 2_500_000; // 2.5MB

function json(status: number, body: any, headers?: Record<string, string>) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(headers || {}),
    },
  });
}

function pickExt(fileName: string): string {
  const ext = (fileName.split('.').pop() || 'png').toLowerCase();
  return /^(png|jpg|jpeg|webp)$/i.test(ext) ? ext : 'png';
}

/**
 * Upload avatar via server (service-role) to avoid Storage RLS failures from the browser.
 * Bucket strategy:
 * - Prefer using the existing `review_avatars` bucket (commonly present in your Supabase setup)
 * - Store under `profiles/<userId>/...` to keep it separated from review assets.
 */
export async function POST(req: NextRequest) {
  return withRequestId(req, async () => {
    const rid = getRequestId(req.headers);

    // Require authenticated user (Supabase session cookie)
    let sb;
    try {
      sb = await supabaseServer();
    } catch (e: any) {
      return json(500, { ok: false, error: e?.message || 'Supabase server client not available', requestId: rid }, { 'X-Request-ID': rid });
    }

    // Prefer cookie-based session; fall back to bearer token (browser client keeps session in localStorage).
    const authz = (req.headers.get('authorization') || '').trim();
    const bearer = /^bearer\s+/i.test(authz) ? authz.replace(/^bearer\s+/i, '').trim() : '';

    const { data: authData, error: authErr } = bearer
      ? await sb.auth.getUser(bearer)
      : await sb.auth.getUser();
    const user = authData?.user || null;
    if (authErr || !user) {
      return json(401, { ok: false, error: 'Unauthorized', requestId: rid }, { 'X-Request-ID': rid });
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return json(400, { ok: false, error: 'Invalid form-data', requestId: rid }, { 'X-Request-ID': rid });
    }

    const file = form.get('file');
    if (!(file instanceof File)) {
      return json(400, { ok: false, error: 'Missing file', requestId: rid }, { 'X-Request-ID': rid });
    }

    if (file.size > MAX_BYTES) {
      return json(413, { ok: false, error: `File too large (max ${(MAX_BYTES / 1_000_000).toFixed(1)}MB)`, requestId: rid }, { 'X-Request-ID': rid });
    }

    const ext = pickExt(file.name);
    const contentType = file.type || (ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`);

    const buf = Buffer.from(await file.arrayBuffer());

    const bucket = 'review_avatars';
    const path = `profiles/${user.id}/${Date.now()}.${ext}`;

    try {
      const admin = getSupabaseAdmin();

      const up = await admin.storage.from(bucket).upload(path, buf, {
        upsert: true,
        contentType,
        cacheControl: '3600',
      });

      if (up.error) {
        return json(500, { ok: false, error: up.error.message || 'Upload failed', requestId: rid }, { 'X-Request-ID': rid });
      }

      const { data: urlData } = admin.storage.from(bucket).getPublicUrl(path);
      const url = urlData?.publicUrl || '';

      if (!url) {
        return json(500, { ok: false, error: 'Could not resolve public URL', requestId: rid }, { 'X-Request-ID': rid });
      }

      return json(200, { ok: true, url, bucket, path, requestId: rid }, { 'X-Request-ID': rid });
    } catch (e: any) {
      return json(500, { ok: false, error: e?.message || 'Upload error', requestId: rid }, { 'X-Request-ID': rid });
    }
  });
}
