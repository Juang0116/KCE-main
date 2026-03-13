// src/lib/opsApprovals.server.ts
import 'server-only';

import { getSupabaseAdminAny } from '@/lib/supabaseAdminAny.server';

function jsonSafe(value: unknown): any {
  return JSON.parse(JSON.stringify(value, (_k, v) => (v === undefined ? null : v)));
}

export type CreateApprovalInput = {
  action: string;
  payload: Record<string, any>;
  requestId?: string | null;
  requestedBy?: string | null;
  ttlMinutes: number;
};

type OpsApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export async function createOpsApproval(input: CreateApprovalInput): Promise<any> {
  const admin = getSupabaseAdminAny();
  const ttl = Math.max(1, Number(input.ttlMinutes || 0));
  const expiresAt = new Date(Date.now() + ttl * 60_000).toISOString();

  const { data, error } = await admin
    .from('crm_ops_approvals')
    .insert({
      status: 'pending',
      expires_at: expiresAt,
      action: String(input.action || '').trim(),
      payload: jsonSafe(input.payload ?? {}),
      request_id: input.requestId ?? null,
      requested_by: input.requestedBy ?? null,
    } as any)
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to create approval');
  return data;
}

export async function approveOpsApproval(opts: { id: string; approvedBy?: string | null }): Promise<any> {
  const admin = getSupabaseAdminAny();
  const nowIso = new Date().toISOString();

  const { data: current, error: curErr } = await admin
    .from('crm_ops_approvals')
    .select('*')
    .eq('id', opts.id)
    .single();

  if (curErr || !current) throw new Error(curErr?.message || 'Approval not found');

  const status = String((current as any).status || '') as OpsApprovalStatus;
  if (status !== 'pending') return current;

  const expRaw = (current as any).expires_at ? String((current as any).expires_at) : '';
  const expMs = expRaw ? new Date(expRaw).getTime() : NaN;

  // If expires_at is missing/invalid, fail safe by expiring.
  if (!Number.isFinite(expMs) || expMs <= Date.now()) {
    const { data: expired, error: expErr } = await admin
      .from('crm_ops_approvals')
      .update({ status: 'expired' } as any)
      .eq('id', opts.id)
      .select('*')
      .single();

    if (expErr || !expired) throw new Error(expErr?.message || 'Failed to expire approval');
    return expired;
  }

  const { data, error } = await admin
    .from('crm_ops_approvals')
    .update(
      {
        status: 'approved',
        approved_by: opts.approvedBy ?? null,
        approved_at: nowIso,
      } as any,
    )
    .eq('id', opts.id)
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to approve');
  return data;
}

export async function listOpsApprovals(status: OpsApprovalStatus, limit = 50): Promise<any[]> {
  const admin = getSupabaseAdminAny();
  const lim = Math.min(Math.max(Number(limit || 0), 1), 500);

  const { data, error } = await admin
    .from('crm_ops_approvals')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(lim);

  if (error) throw new Error(error.message);
  return (data ?? []) as any[];
}
