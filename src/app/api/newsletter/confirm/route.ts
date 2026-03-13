// src/app/api/newsletter/confirm/route.ts
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

type NewsletterSub = {
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
      await logEvent(
        'api.config_error',
        { route: 'api/newsletter/confirm', requestId, message: 'supabase_admin_unavailable' },
        { source: 'api/newsletter/confirm' },
      );
      return NextResponse.redirect(new URL('/newsletter?confirmed=0&err=cfg', req.url));
    }

    // ⛑️ Hotfix: tipos Supabase desalineados (TS infiere never). Cast controlado.
    const admin = adminRaw as any;

    const tokenHash = sha256Hex(token);

    const q = await admin
      .from('newsletter_subscriptions')
      .select('id,email,status')
      .eq('confirm_token_hash', tokenHash)
      .maybeSingle();

    if (q?.error) throw q.error;

    const sub = (q?.data as NewsletterSub | null | undefined) ?? null;

    if (!sub) {
      await logEvent(
        'newsletter.confirm_invalid',
        { requestId },
        { source: 'api/newsletter/confirm' },
      );
      return NextResponse.redirect(new URL('/newsletter?confirmed=0&err=invalid', req.url));
    }

    if (sub.status === 'confirmed') {
      return NextResponse.redirect(new URL('/newsletter?confirmed=1&already=1', req.url));
    }

    const nowIso = new Date().toISOString();

    await admin
      .from('newsletter_subscriptions')
      .update(
        {
          status: 'confirmed',
          confirmed_at: nowIso,
          confirm_token_hash: null,
        } as any,
      )
      .eq('id', sub.id);

    await logEvent(
      'newsletter.signup_confirmed',
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
        source: 'api/newsletter/confirm',
        dedupeKey: `newsletter:confirmed:${sub.email}:${bucket}`,
      },
    );

    return NextResponse.redirect(new URL('/newsletter?confirmed=1', req.url));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    await logEvent(
      'api.error',
      { route: 'api/newsletter/confirm', requestId, message },
      { source: 'api/newsletter/confirm' },
    );

    return NextResponse.redirect(new URL('/newsletter?confirmed=0&err=server', req.url));
  }
}
