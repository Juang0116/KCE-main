import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdminScope } from '@/lib/adminAuth';
import { logEvent } from '@/lib/events.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  q: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  const auth = await requireAdminScope(req);
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success)
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });

    const { q, country, language, page, limit } = parsed.data;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('Supabase admin not configured');

    // AQUÍ ESTÁ LA MAGIA: Agregamos identity_status e identity_doc_path
    let query = (admin as any)
      .from('customers')
      .select(
        'id, email, name, phone, country, language, identity_status, identity_doc_path, created_at',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (country) query = query.eq('country', country);
    if (language) query = query.eq('language', language);
    if (q?.trim()) {
      const term = q.trim();
      query = query.or(`email.ilike.%${term}%,name.ilike.%${term}%,phone.ilike.%${term}%`);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json(
      { items: data ?? [], page, limit, total: count ?? 0, requestId },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
