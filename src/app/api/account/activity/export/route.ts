import { NextResponse } from 'next/server';

import { supabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

function csvEscape(v: unknown) {
  const s = String(v ?? '');
  if (/[\n\r",]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export async function GET() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('user_events')
    .select('id,type,created_at,ip,ua,meta')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = ['created_at', 'type', 'summary', 'ip', 'ua'];
  const lines = [header.join(',')];

  for (const row of data ?? []) {
    const meta = (row as any).meta ?? {};
    const summary = meta?.summary || meta?.action || meta?.message || '';
    const out = [
      csvEscape((row as any).created_at),
      csvEscape((row as any).type),
      csvEscape(summary),
      csvEscape((row as any).ip),
      csvEscape((row as any).ua),
    ];
    lines.push(out.join(','));
  }

  const csv = lines.join('\n');
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="kce-activity.csv"',
      'cache-control': 'no-store',
    },
  });
}
