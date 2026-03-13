// src/app/api/admin/auth/logout/route.ts
import 'server-only';

import { NextResponse } from 'next/server';

export async function POST() {
  const res = new NextResponse(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
  res.cookies.set('admin_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}
