import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  title: z.string().min(3).max(180).optional(),
  content: z.string().min(20).max(5000).optional(),
  tags: z.array(z.string().min(1).max(32)).max(20).optional(),
  enabled: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req, 'system_admin');
  if (!auth.ok) return auth.response;

  const reqId = getRequestId(req.headers);
  const { id } = await ctx.params;

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: 'Supabase admin not configured.' }, { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', requestId: reqId }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten(), requestId: reqId },
      { status: 400 },
    );
  }

  const patch: Record<string, any> = {};
  if (typeof parsed.data.title === 'string') patch.title = parsed.data.title;
  if (typeof parsed.data.content === 'string') patch.content = parsed.data.content;
  if (Array.isArray(parsed.data.tags)) patch.tags = parsed.data.tags;
  if (typeof parsed.data.enabled === 'boolean') patch.enabled = parsed.data.enabled;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No changes', requestId: reqId }, { status: 400 });
  }

  const { data, error } = await (sb as any)
    .from('ai_playbook_snippets')
    .update(patch)
    .eq('id', id)
    .select('id,title,content,tags,enabled,created_at,updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message, requestId: reqId }, { status: 500 });
  return NextResponse.json({ item: data }, { status: 200 });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminScope(req, 'system_admin');
  if (!auth.ok) return auth.response;

  const reqId = getRequestId(req.headers);
  const { id } = await ctx.params;

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: 'Supabase admin not configured.' }, { status: 503 });

  const { error } = await (sb as any).from('ai_playbook_snippets').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message, requestId: reqId }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 200 });
}
