// src/lib/costBudget.server.ts
import 'server-only';

import type { NextRequest } from 'next/server';

import { checkRateLimit } from '@/lib/rateLimit.server';
import { getRequestChannel } from '@/lib/requestGuards.server';

/**
 * Daily cost budgets per visitor (vid) for high-cost endpoints.
 *
 * Implemented on top of event_locks-based rate limiting (windowSeconds=86400).
 * This works well on serverless (no in-memory state) and stays consistent with
 * the rest of the app's abuse protections.
 */
export async function enforceCostBudget(
  req: NextRequest,
  kind: 'ai' | 'checkout' | 'bot_checkout',
  opts?: { limitPerDay?: number },
): Promise<{ allowed: boolean; retryAfterSeconds?: number; remaining?: number; keyBase: string }> {
  const channel = getRequestChannel(req);
  const envKey =
    kind === 'ai'
      ? 'COST_BUDGET_AI_PER_DAY'
      : kind === 'checkout'
        ? 'COST_BUDGET_CHECKOUT_PER_DAY'
        : 'COST_BUDGET_BOT_CHECKOUT_PER_DAY';

  const fallback =
    kind === 'ai' ? 30 : kind === 'checkout' ? 10 : 10;

  const limit =
    typeof opts?.limitPerDay === 'number'
      ? opts.limitPerDay
      : (() => {
          const raw = String(process.env[envKey] || '').trim();
          const n = Number(raw);
          return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
        })();

  return await checkRateLimit(req, {
    action: `budget.${kind}.${channel}`,
    limit,
    windowSeconds: 60 * 60 * 24,
    identity: 'vid',
    // If Supabase isn't reachable we don't want to hard-block checkout/AI.
    // You can tighten this later by setting failOpen to false.
    failOpen: true,
  });
}
