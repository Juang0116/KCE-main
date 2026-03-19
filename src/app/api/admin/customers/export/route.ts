import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { checkRateLimit } from '@/lib/rateLimit.server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  q: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(5000).default(2000),
});

/**
 * Escapa valores para CSV siguiendo el estándar RFC 4180
 */
function toCsvValue(v: unknown): string {
  const s = String(v ?? '');
  if (/[\n\r",]/.test(s)) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  
  // 1. Autorización
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  // 2. Rate Limit para proteger el servidor de exportaciones masivas
  const rl = await checkRateLimit(req, {
    action: 'admin.export.customers',
    limit: 5,
    windowSeconds: 60,
  });

  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas exportaciones. Espera un minuto.', requestId },
      { 
        status: 429, 
        headers: withRequestId({ 'Retry-After': '60' }, requestId) 
      }
    );
  }

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      q: url.searchParams.get('q') ?? undefined,
      country: url.searchParams.get('country') ?? undefined,
      language: url.searchParams.get('language') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Filtros inválidos', details: parsed.error.flatten(), requestId }, { status: 400 });
    }

    const { q, country, language, limit } = parsed.data;
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('Supabase no configurado');

    // 3. Query a la base de datos
    let query = (admin as any)
      .from('customers')
      .select('id, email, name, phone, country, language, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (country) query = query.eq('country', country);
    if (language) query = query.eq('language', language);

    if (q?.trim()) {
      const qq = q.trim();
      query = query.or(`email.ilike.%${qq}%,name.ilike.%${qq}%,phone.ilike.%${qq}%`);
    }

    const { data: rows, error: dbError } = await query;
    if (dbError) throw dbError;

    // 4. Construcción del CSV
    const headers = ['id', 'email', 'name', 'phone', 'country', 'language', 'created_at'];
    
    // Transformamos los datos en filas de texto
    const csvRows = (rows || []).map((r: any) => [
      r.id, r.email, r.name, r.phone, r.country, r.language, r.created_at
    ]);

    // --- CORRECCIÓN ERROR 7006 ---
    // Definimos explícitamente el tipo de 'row' como any[] o string[]
    const csvBody = csvRows.map((row: any[]) => 
      row.map(toCsvValue).join(',')
    ).join('\n');
    // -----------------------------

    const csvContent = `${headers.join(',')}\n${csvBody}`;

    // Prefijo BOM (\uFEFF) para que Excel reconozca UTF-8 (tildes, eñes, etc.)
    const finalFile = `\uFEFF${csvContent}`;

    // 5. Auditoría (Corregido Error 2379)
    void logEvent(
      'admin.customers_exported', 
      { count: csvRows.length, filters: parsed.data, requestId }, 
      { userId: auth.actor ?? null, source: 'admin' }
    );

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `kce_clientes_${dateStr}.csv`;

    return new NextResponse(finalFile, {
      status: 200,
      headers: withRequestId({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      }, requestId),
    });

  } catch (err: any) {
    void logEvent('api.error', { route: 'admin.customers.export', error: err.message, requestId }, { userId: auth.actor ?? null });
    return NextResponse.json({ error: 'Error al generar el reporte', requestId }, { status: 500 });
  }
}