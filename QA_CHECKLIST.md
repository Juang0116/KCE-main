# KCE 3.0 — QA Checklist (Manual Acceptance)

Use this list before any production release.

## 0) Pre-flight

- [ ] Secrets rotated (Supabase anon + service role, Stripe secret + webhook, Resend, OpenAI/Gemini)
- [ ] `.env.local` never committed (verify git status + `.gitignore`)
- [ ] `npm run build` passes locally

## 1) Health

- [ ] `GET /api/health` returns `ok: true`
- [ ] `GET /api/webhooks/stripe` health returns Stripe + Supabase configured
- [ ] `GET /api/ai` health works in dev (non-prod)

## 2) Tours

- [ ] `/tours` renders list
- [ ] `/tours/[slug]` renders detail
- [ ] Images missing/malformed do NOT break UI

## 3) Checkout + Booking + Invoice

- [ ] Start checkout from a tour
- [ ] Stripe payment succeeds in test mode
- [ ] Webhook marks booking as `paid`
- [ ] Invoice email arrives once, with attached PDF
- [ ] `/booking/[session_id]` shows paid status + correct totals

## 4) Reviews (Moderated)

- [ ] Submit a review → should be `pending`
- [ ] Approve in admin → appears publicly
- [ ] Reject in admin → never appears publicly

## 5) CRM + Tickets

- [ ] Newsletter signup creates lead (when enabled)
- [ ] Ticket handoff: complaint/refund message creates ticket
- [ ] Admin reply appears in conversation thread

## 6) Marketing Hub

- [ ] `/social` renders, only shows links that are configured in env
- [ ] Link preview (OG/Twitter): shares for `/tours/[slug]` show correct title + image
- [ ] UTM capture: visit with `utm_*` logs `marketing.utm_capture`

## 7) Capture & Conversion

- [ ] Personalized plan submits and returns real tours
- [ ] Newsletter double opt-in works (confirm/unsubscribe)
- [ ] Wishlist works with Supabase magic link login

## 8) Attribution & Metrics

- [ ] With `utm_*`, create `tour.view`, `checkout.started`, and `checkout.paid`
- [ ] `/admin/metrics` shows Top campaigns + by-tour breakdown

## 9) Abuse & Rate Limit

- [ ] Repeated spam submits on review/newsletter/plan return HTTP 429
- [ ] No duplicate bookings/emails on repeated webhooks (idempotent)
