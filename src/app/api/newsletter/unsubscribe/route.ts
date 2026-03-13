// src/app/api/newsletter/unsubscribe/route.ts
import 'server-only';

import crypto from 'node:crypto';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { logEvent } from '@/lib/events.server';
import { getRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { readUtmFromCookies, utmCompactKey } from '@/lib/utm.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  token: z.string().min(16),
});

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

type NewsletterSubMini = {
  id: string;
  email: string;
  status: 'pending' | 'confirmed' | 'unsubscribed' | string;
};

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const utmInfo = readUtmFromCookies(req);
  const utmKey = utmCompactKey(utmInfo);
  const bucket = Math.floor(Date.now() / 5000);

  try {
    const url = new URL(req.url);
    const { token } = QuerySchema.parse({ token: url.searchParams.get('token') ?? '' });

    const adminRaw = getSupabaseAdmin();
    if (!adminRaw) {
      // no rompemos UX: redirige con err=server
      return NextResponse.redirect(new URL('/newsletter?unsubscribed=0&err=server', req.url));
    }

    // ⛑️ Hotfix: tipos Supabase desalineados -> TS infiere never
    const admin = adminRaw as any;

    const tokenHash = sha256Hex(token);

    const q = await admin
      .from('newsletter_subscriptions')
      .select('id,email,status')
      .eq('unsubscribe_token_hash', tokenHash)
      .maybeSingle();

    if (q?.error) throw q.error;

    const sub = (q?.data as NewsletterSubMini | null | undefined) ?? null;

    if (!sub?.id) {
      await logEvent(
        'newsletter.unsubscribe_invalid',
        { requestId },
        { source: 'api/newsletter/unsubscribe' },
      );
      return NextResponse.redirect(new URL('/newsletter?unsubscribed=0&err=invalid', req.url));
    }

    const nowIso = new Date().toISOString();

    const upd = await admin
      .from('newsletter_subscriptions')
      .update(
        {
          status: 'unsubscribed',
          unsubscribed_at: nowIso,
          confirm_token_hash: null,
          unsubscribe_token_hash: null,
        } as any,
      )
      .eq('id', sub.id);

    if (upd?.error) throw upd.error;

    await logEvent(
      'newsletter.unsubscribed',
      {
        requestId,
        email: sub.email,
        vid: utmInfo.vid,
        utm_key: utmKey,
        utm_source: utmInfo.utm_source,
        utm_medium: utmInfo.utm_medium,
        utm_campaign: utmInfo.utm_campaign,
      },
      {
        source: 'api/newsletter/unsubscribe',
        dedupeKey: `newsletter:unsubscribed:${sub.email}:${bucket}`,
      },
    );

    return NextResponse.redirect(new URL('/newsletter?unsubscribed=1', req.url));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    await logEvent(
      'api.error',
      { route: 'api/newsletter/unsubscribe', requestId, message },
      { source: 'api/newsletter/unsubscribe' },
    );

    return NextResponse.redirect(new URL('/newsletter?unsubscribed=0&err=server', req.url));
  }
}
