import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminCapability } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { logEvent } from '@/lib/events.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  // El código debe ser URL-friendly: minúsculas, números, guiones
  code: z.string().trim().min(2).max(64).regex(/^[a-z0-9][a-z0-9_-]{1,63}$/i),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().optional(),
  commission_bps: z.number().int().min(0).max(5000).optional(),
});

// --- GET: Listado maestro de afiliados ---
export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminCapability(req, 'growth.manage');
  if (!auth.ok) return auth.response;

  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { ok: false, requestId, error: 'Supabase admin not configured' },
      { status: 503, headers: withRequestId(undefined, requestId) },
    );
  }

  const { data, error } = await (sb as any)
    .from('affiliates')
    .select('id, code, name, email, status, commission_bps, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json(
      { ok: false, requestId, error: error.message },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }

  return NextResponse.json(
    { ok: true, requestId, items: data ?? [] },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}

// --- POST: Crear un nuevo partner ---
export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminCapability(req, 'growth.manage');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = CreateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, requestId, error: 'Datos inválidos', issues: parsed.error.issues },
        { status: 400, headers: withRequestId(undefined, requestId) },
      );
    }

    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json(
        { ok: false, requestId, error: 'Supabase admin not configured' },
        { status: 503, headers: withRequestId(undefined, requestId) },
      );
    }

    // Normalizamos el código a minúsculas para evitar duplicados visuales (ej: "JUAN" vs "juan")
    const affiliateCode = parsed.data.code.toLowerCase();

    const { data, error } = await (sb as any)
      .from('affiliates')
      .insert({
        code: affiliateCode,
        name: parsed.data.name,
        email: parsed.data.email ?? null,
        commission_bps: parsed.data.commission_bps ?? 1000, // Default 10%
        status: 'active',
      })
      .select('id, code, name, email, status, commission_bps, created_at')
      .single();

    if (error) {
      // Manejo específico para códigos duplicados
      if (error.code === '23505') {
        return NextResponse.json(
          { ok: false, requestId, error: 'El código de afiliado ya existe' },
          { status: 409, headers: withRequestId(undefined, requestId) },
        );
      }
      throw error;
    }

    void logEvent('admin.affiliate_created', { affiliateId: data.id, code: data.code });

    return NextResponse.json(
      { ok: true, requestId, item: data },
      { status: 200, headers: withRequestId(undefined, requestId) },
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, requestId, error: err.message || 'Server error' },
      { status: 500, headers: withRequestId(undefined, requestId) },
    );
  }
}