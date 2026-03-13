import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';

function isTruthyEnv(value: string | null | undefined): boolean {
  const v = String(value || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function isLocalDevHost(host: string | null | undefined): boolean {
  const value = String(host || '').trim().toLowerCase();
  if (!value) return false;
  const bare = value.split(':')[0] || '';
  return bare === 'localhost' || bare === '127.0.0.1';
}

export function requireHealthcheckAccess(req: NextRequest) {
  const host = req.headers.get('host');
  const localDevBypass =
    process.env.NODE_ENV !== 'production' &&
    isTruthyEnv(process.env.ADMIN_DEV_OPEN || '') &&
    isLocalDevHost(host);

  if (localDevBypass) return null;

  const healthToken = (process.env.HEALTHCHECK_TOKEN || '').trim();
  const adminToken = (process.env.ADMIN_TOKEN || '').trim();

  const providedHealth =
    (req.headers.get('x-healthcheck-token') || '').trim() ||
    (req.nextUrl.searchParams.get('token') || '').trim();
  const providedAdmin = (req.headers.get('x-admin-token') || '').trim();

  if (healthToken && providedHealth && providedHealth === healthToken) return null;
  if (adminToken && providedAdmin && providedAdmin === adminToken) return null;

  return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
}
