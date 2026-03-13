// src/lib/breakglass.server.ts
import 'server-only';

import crypto from 'crypto';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';

function sha256Hex(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function b64url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function issueBreakglassToken(input: { actor: string; ttlMinutes: number; reason?: string; createdBy?: string }) {
  const admin = getSupabaseAdmin();
  const token = b64url(crypto.randomBytes(24));
  const token_hash = sha256Hex(token);
  const expires_at = new Date(Date.now() + Math.max(5, input.ttlMinutes) * 60_000).toISOString();

  const { error } = await (admin as any).from('crm_breakglass_tokens').insert({
    token_hash,
    actor: input.actor,
    reason: input.reason || null,
    created_by: input.createdBy || null,
    expires_at,
  });

  if (error) throw new Error(error.message);

  return { token, token_hash, actor: input.actor, expires_at };
}
