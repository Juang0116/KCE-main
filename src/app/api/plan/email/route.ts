// src/app/api/plan/email/route.ts
// Sends the rich itinerary email after itinerary-builder responds on the client.
import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { checkRateLimit } from '@/lib/rateLimit.server';
import { getRequestId, withRequestId } from '@/lib/requestId';
import { sendPlanResultsEmail } from '@/services/marketingEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20;

const BlockSchema = z.object({
  time: z.string(),
  title: z.string(),
  neighborhood: z.string().optional(),
  description: z.string(),
  approx_cost_cop: z.number().optional(),
});

const DaySchema = z.object({
  day: z.number().int().min(1),
  date: z.string(),
  title: z.string(),
  summary: z.string(),
  blocks: z.array(BlockSchema),
  safety: z.string(),
});

const BodySchema = z.object({
  to: z.string().email(),
  name: z.string().max(120).optional().nullable(),
  richPlan: z
    .object({
      city: z.string(),
      days: z.number().int().min(1),
      budgetCOPPerPersonPerDay: z.object({ min: z.number(), max: z.number() }),
      itinerary: z.array(DaySchema),
      totals: z.object({ approx_total_cop_per_person: z.number() }),
    })
    .optional()
    .nullable(),
  marketingCopy: z
    .object({ headline: z.string().optional(), subhead: z.string().optional() })
    .optional()
    .nullable(),
  recommendations: z
    .array(z.object({ title: z.string(), url: z.string(), city: z.string().optional().nullable() }))
    .optional()
    .default([]),
});

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);

  const rl = await checkRateLimit(req, {
    action: 'plan.email',
    limit: 5,
    windowSeconds: 3600,
    identity: 'ip',
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Rate limited', requestId },
      { status: 429, headers: withRequestId(undefined, requestId) },
    );
  }

  const raw = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid body', details: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestId(undefined, requestId) },
    );
  }

  const { to, name, richPlan, marketingCopy, recommendations } = parsed.data;

  await sendPlanResultsEmail({
    to,
    name: name ?? null,
    recommendations: recommendations.map((r) => ({
      title: r.title,
      url: r.url,
      ...(r.city != null ? { city: r.city } : {}),
    })),
    richPlan: richPlan ?? null,
    marketingCopy: marketingCopy ?? null,
  });

  return NextResponse.json(
    { ok: true, requestId },
    { status: 200, headers: withRequestId(undefined, requestId) },
  );
}
