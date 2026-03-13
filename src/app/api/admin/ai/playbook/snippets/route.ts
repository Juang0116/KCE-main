import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { requireAdminScope } from '@/lib/adminAuth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { getRequestId } from '@/lib/requestId';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  title: z.string().min(3).max(180),
  content: z.string().min(20).max(5000),
  tags: z.array(z.string().min(1).max(32)).max(20).optional(),
  enabled: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminScope(req, 'system_view');
    if (!auth.ok) return auth.response;

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: 'Supabase admin not configured.' }, { status: 503 });

    const { data, error } = await (sb as any)
      .from('ai_playbook_snippets')
      .select('id,title,content,tags,enabled,created_at,updated_at')
      .order('updated_at', { ascending: false })
      .limit(200);

    if (error) {
      // Patch not applied yet.
      if (/relation .*ai_playbook_snippets/i.test(error.message)) {
        return NextResponse.json(
          {
            items: [],
            hint: 'Aplica supabase_patch_p70_ai_playbook.sql para habilitar el Playbook.',
          },
          { status: 200 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'Unhandled error in GET /api/admin/ai/playbook/snippets',
        detail: String(err?.message ?? err),
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const reqId = getRequestId(req.headers);
  try {
    const auth = await requireAdminScope(req, 'system_admin');
    if (!auth.ok) return auth.response;

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: 'Supabase admin not configured.' }, { status: 503 });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON', requestId: reqId }, { status: 400 });
    }

    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten(), requestId: reqId },
        { status: 400 },
      );
    }

    const payload = {
      title: parsed.data.title,
      content: parsed.data.content,
      tags: parsed.data.tags ?? [],
      enabled: parsed.data.enabled ?? true,
    };

    const { data, error } = await (sb as any)
      .from('ai_playbook_snippets')
      .insert(payload)
      .select('id,title,content,tags,enabled,created_at,updated_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message, requestId: reqId }, { status: 500 });
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'Unhandled error in POST /api/admin/ai/playbook/snippets',
        requestId: reqId,
        detail: String(err?.message ?? err),
      },
      { status: 500 },
    );
  }
}
