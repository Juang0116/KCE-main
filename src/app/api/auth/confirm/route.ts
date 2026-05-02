export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  
  // Extraemos los parámetros que manda Supabase
  const error = requestUrl.searchParams.get('error');
  const next = requestUrl.searchParams.get('next') || '/es/account';

  // 1. Si el usuario hace clic en un link viejo o caducado (Como en tu captura)
  if (error) {
    return NextResponse.redirect(new URL('/es/login?error=El_enlace_ha_caducado_o_es_invalido', request.url));
  }

  // 2. Si el link es válido y todo está bien, lo dejamos pasar a su cuenta
  return NextResponse.redirect(new URL(next, request.url));
}