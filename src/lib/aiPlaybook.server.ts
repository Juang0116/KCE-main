// src/lib/aiPlaybook.server.ts
import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

export type PlaybookSnippet = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  enabled: boolean;
  updated_at: string;
};

/**
 * Fetches enabled AI playbook snippets.
 *
 * Safety:
 * - These snippets are human-approved content injected into the system prompt.
 * - If the table is not installed, this returns an empty list.
 */
export async function getEnabledPlaybookSnippets(opts?: { limit?: number }): Promise<PlaybookSnippet[]> {
  const limit = Math.max(1, Math.min(50, Math.trunc(opts?.limit ?? 10)));

  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const res = await (admin as any)
    .from('ai_playbook_snippets')
    .select('id,title,content,tags,enabled,updated_at')
    .eq('enabled', true)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (res.error) {
    // If patch not applied yet, treat as empty.
    if (/relation .*ai_playbook_snippets/i.test(res.error.message)) return [];
    throw new Error(res.error.message);
  }

  return ((res.data as PlaybookSnippet[] | null) ?? []).map((r) => ({
    id: String((r as any).id),
    title: String((r as any).title || ''),
    content: String((r as any).content || ''),
    tags: Array.isArray((r as any).tags) ? (r as any).tags.map((x: any) => String(x)) : [],
    enabled: Boolean((r as any).enabled),
    updated_at: String((r as any).updated_at || ''),
  }));
}

export function formatPlaybookForPrompt(snips: PlaybookSnippet[]): string {
  if (!snips.length) return '';

  const lines: string[] = [];
  lines.push('Playbook interno (respuestas/políticas aprobadas por KCE):');

  for (const s of snips) {
    const title = String(s.title || '').trim().slice(0, 180);
    const content = String(s.content || '').trim().replace(/\s+/g, ' ').slice(0, 1200);
    if (!title || !content) continue;
    lines.push(`- ${title}: ${content}`);
  }

  return lines.join('\n');
}
