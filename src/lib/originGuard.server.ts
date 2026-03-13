// src/lib/originGuard.server.ts
import 'server-only';

import type { NextRequest } from 'next/server';

import { jsonError } from '@/lib/apiErrors';
import { getAllowedOrigins } from '@/lib/cors';
import { SITE_URL } from '@/lib/env';
import { requireInternalHmac } from '@/lib/internalHmac.server';

type OriginGuardOpts = {
  route: string;
  requireContext?: boolean;
};

function normalizeOrigin(input: string) {
  try {
    return new URL(input).origin;
  } catch {
    return '';
  }
}

function defaultAllowedOrigins(): string[] {
  const allowed = getAllowedOrigins();
  if (allowed.length) return allowed;

  const fallback = (SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  const o = fallback ? normalizeOrigin(fallback) : '';
  return o ? [o] : [];
}

function isDevLocal(origin: string) {
  return (
    origin === 'http://localhost:3000' ||
    origin === 'http://127.0.0.1:3000' ||
    origin === 'http://localhost:3001' ||
    origin === 'http://127.0.0.1:3001'
  );
}

export async function enforceOriginOrInternal(req: NextRequest, opts: OriginGuardOpts) {
  const isProd = process.env.NODE_ENV === 'production';
  const requireContext = typeof opts.requireContext === 'boolean' ? opts.requireContext : isProd;

  if (req.method === 'OPTIONS') return null;

  const hasInternal = Boolean(req.headers.get('x-kce-ts') && req.headers.get('x-kce-sig'));
  if (hasInternal) {
    const internalErr = await requireInternalHmac(req, { required: true });
    if (internalErr) return internalErr;
    return null;
  }

  const allowed = defaultAllowedOrigins();
  const origin = (req.headers.get('origin') || '').trim();
  const referer = (req.headers.get('referer') || '').trim();
  const originFromRef = referer ? normalizeOrigin(referer) : '';

  if (!isProd) {
    const o = origin || originFromRef;
    if (o && isDevLocal(o)) return null;
    if (!allowed.length) return null;
  }

  if (!allowed.length) return null;

  const candidate = origin || originFromRef;

  if (!candidate) {
    if (!requireContext) return null;
    return jsonError(req, {
      status: 403,
      code: 'FORBIDDEN',
      message: `Forbidden (${opts.route}): missing Origin/Referer`,
    });
  }

  if (!allowed.includes(candidate)) {
    return jsonError(req, {
      status: 403,
      code: 'FORBIDDEN',
      message: `Forbidden (${opts.route}): origin not allowed`,
      extra: { origin: candidate },
    });
  }

  return null;
}
