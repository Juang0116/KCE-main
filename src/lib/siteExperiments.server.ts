// src/lib/siteExperiments.server.ts
import 'server-only';

import crypto from 'node:crypto';
import { cookies, headers } from 'next/headers';

function isoWeekId(d: Date): string {
  // ISO week YYYY-Www
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7);
  const yyyy = date.getUTCFullYear();
  const ww = String(week).padStart(2, '0');
  return `${yyyy}-W${ww}`;
}

function stableHashInt(input: string): number {
  const h = crypto.createHash('sha256').update(input).digest();
  // take first 4 bytes as uint32
  return h.readUInt32BE(0);
}

export type AbVariant = 'A' | 'B';

export async function getCohortWeekFromHeaders(): Promise<string> {
  // Prefer request date header if present; otherwise now()
  const h = await headers();
  const reqDate = h.get('date');
  const d = reqDate ? new Date(reqDate) : new Date();
  return isoWeekId(d);
}

export async function chooseVariant(opts: {
  experimentKey: string;
  defaultVariant?: AbVariant;
  forcedEnvVar?: string; // if set to 'A'|'B' it overrides
}): Promise<{ variant: AbVariant; cohort: string; vid: string | null }> {
  const cohort = await getCohortWeekFromHeaders();

  // NOTE: forcedEnvVar is the VALUE, not the env var name.
  const forced = String(opts.forcedEnvVar || '').trim().toUpperCase();
  const c = await cookies();
  const vid = c.get('kce_vid')?.value ?? null;

  if (forced === 'A' || forced === 'B') {
    return { variant: forced as AbVariant, cohort, vid };
  }

  const fallback = opts.defaultVariant ?? 'A';
  if (!vid) return { variant: fallback, cohort, vid: null };

  const n = stableHashInt(`${opts.experimentKey}:${vid}:${cohort}`);
  return { variant: n % 2 === 0 ? 'A' : 'B', cohort, vid };
}

export async function getProofStackVariant(): Promise<{ variant: AbVariant; cohort: string; vid: string | null }> {
  // Env override for quick “winner lock” in prod if you decide
  const forced = process.env.SITE_PROOFSTACK_VARIANT || '';
  return chooseVariant({ experimentKey: 'site.proofstack', defaultVariant: 'A', forcedEnvVar: forced });
}
