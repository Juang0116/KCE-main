// src/app/admin/ops/runbooks/page.tsx
import 'server-only';

import Link from 'next/link';

export const dynamic = 'force-dynamic';

type RB = { kind: string; title: string; steps: string[] };

const RUNBOOKS: RB[] = [
  {
    kind: 'checkout_error',
    title: 'Checkout errors (Stripe session creation)',
    steps: [
      'Verify Stripe keys in Vercel: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and site URL variables (SITE_URL/NEXT_PUBLIC_SITE_URL).',
      'Confirm the route /api/checkout returns 200 locally and in prod, and that CSP/allowed origins are not blocking it.',
      'Check Stripe dashboard: failures, invalid price/currency, and whether Checkout Session is created.',
      'Look at /admin/ops/incidents meta: slug/date/guests, origin, and requestId to reproduce.',
      'If spikes continue, keep ops_pause:checkout active for 10–15 minutes while fixing env/config.',
    ],
  },
  {
    kind: 'email_send_error',
    title: 'Email send errors (Resend / templates)',
    steps: [
      'Validate RESEND_API_KEY, EMAIL_FROM, and EMAIL_REPLY_TO in env.',
      'Check Resend dashboard for bounces/rejections (from domain not verified, rate limits).',
      'If using attachments (PDF), verify size and base64 encoding.',
      'If spikes continue, pause ops_pause:email to stop cascading retries; outbound queue will mark as failed/canceled when paused.',
    ],
  },
  {
    kind: 'admin_signed_action_invalid',
    title: 'Signed Action invalid (nonce/exp/origin)',
    steps: [
      'Confirm browser time is correct (exp can fail if device time is skewed).',
      'Check Origin/Referer allowlist and ensure you are using the correct domain (no localhost vs prod mismatch).',
      'Verify LINK_TOKEN_SECRET / SIGNED_ACTION_SECRET (if configured) are set and stable.',
      'Inspect incident meta for reason: expired, replay, origin mismatch.',
    ],
  },
];

function anchor(kind: string) {
  return encodeURIComponent(kind);
}

export default function AdminOpsRunbooksPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-6">
        <h1 className="text-xl font-semibold">OPS Runbooks</h1>
        <p className="mt-2 text-sm text-[color:var(--color-text)]/70">
          Guías rápidas para incidentes frecuentes. Desde{' '}
          <Link className="underline" href="/admin/ops/incidents">
            Incidents
          </Link>
          {' '}puedes abrir el runbook por <span className="font-mono">kind</span>.
        </p>
      </div>

      <div className="space-y-4">
        {RUNBOOKS.map((rb) => (
          <article
            key={rb.kind}
            id={anchor(rb.kind)}
            className="rounded-2xl border border-black/10 bg-[color:var(--color-surface)] p-6"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="text-lg font-semibold">{rb.title}</h2>
              <div className="text-xs text-[color:var(--color-text)]/60">
                kind: <span className="font-mono">{rb.kind}</span>
              </div>
            </div>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              {rb.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}
