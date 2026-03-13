# KCE 3.0 — Update Log

This file tracks the incremental patches applied during the P0 → P4 execution plan.

## 2026-01-08 — P4.3 Conversion + UTM Reporting

### What was added

- **UTM capture cookies**: `kce_vid` (visitor id) and `kce_utm` (utm\_\* + gclid/fbclid) persisted
  in cookies.
- **Conversion events include UTM context**: quiz/newsletter/wishlist conversions now log `utm_*`
  and `vid` into `events` payloads.
- **Admin UTM dashboard**: `/admin/metrics` includes a UTM table with counts and rates:
  - Quiz/Capture
  - Confirm/Capture
  - Paid/Capture
  - Paid/Quiz

### What to run

- No DB migrations required for this patch.

### How to validate

1. Open a URL like: `/tours?utm_source=ig&utm_medium=social&utm_campaign=jan`.
2. Complete quiz or confirm newsletter.
3. Check `/admin/metrics` → **UTM / Campañas**.

### Next (recommended)

- Add minimum-sample thresholds (e.g., hide rates when captures < 20).
- Add **capture → paid** and **quiz → paid** breakdown per tour/city.

## 2026-01-08 — P4.4 Campaign ranking + by-tour attribution

### What was added

- **UTM propagation into the full funnel**:
  - `POST /api/checkout` now reads UTM cookies and writes `vid`/`utm_*` into:
    - `events` (`checkout.started`, `checkout.session_created`)
    - Stripe Checkout Session `metadata` (so webhook can attribute paid events)
  - `POST /api/bot/create-checkout` now does the same for bot-driven checkouts.
  - `POST /api/events/view-tour` now logs `tour.view` with `vid`/`utm_*` so campaign attribution
    works from the top of the funnel.
  - Stripe webhook now flattens `utm_*` + `tour_slug` into `checkout.paid` payload for reporting.

- **New admin metrics endpoints**:
  - `GET /api/admin/metrics/utm/top` → Top campaigns by Paid/Capture with `min_captures`.
  - `GET /api/admin/metrics/utm/by-tour?utm_key=...` → Views/Started/Paid per tour for the selected
    campaign.

- **Admin UI upgrades** (`/admin/metrics`):
  - **Top campañas** table with a minimum sample filter.
  - **Desglose por tour** for a selected campaign (dropdown + table).

### What to run

- No DB migrations required for this patch.

### How to validate

1. Open a UTM URL (e.g., `...?utm_source=ig&utm_medium=social&utm_campaign=jan`).
2. Visit a tour detail page (logs `tour.view`).
3. Start checkout and complete payment (logs `checkout.started` and `checkout.paid` with UTM).
4. Open `/admin/metrics`:
   - Top campaigns should show Paid/Capture (when samples are sufficient).
   - Select a campaign and verify **Desglose por tour**.

## P4.5 — QA + Hardening (Rate limit + Sanitization + Health)

- Added DB-backed rate limiting using `event_locks` (reviews/newsletter/quiz/ai/wishlist)
- Added minimal sanitization helpers for user text
- Added `/api/health` endpoint (env + supabase config booleans)
- Added `QA_CHECKLIST.md`

## P4.6 — QA Harness (Admin smoke tests)

- Added `/admin/qa` UI to run guided smoke tests.
- Added `GET /api/admin/qa/run` (Node runtime) that checks:
  - ENV presence (Supabase/Stripe/Resend)
  - Supabase Admin read/write
  - Storage buckets list (expects `review_avatars`)
  - Stripe secret format (and optional deep network check with `deep=1`)
- Added `QA_HARNESS.md` documentation.

## P4.7 — Acceptance Runbook (Admin)

- Added `/admin/runbook` to guide manual acceptance tests and track progress.
- Added `POST /api/admin/runbook/log` to persist step results to `events` (`qa.runbook_step`).
- Extended QA harness checks to include head-count presence for core tables (bookings, reviews,
  leads, customers, conversations, messages, tickets, posts, videos, segments, event_locks).
- Added `RUNBOOK_ACCEPTANCE.md` documentation.

## P4.8 — Preflight de Producción + CORS helper (2026-01-09)

- Añadido `src/lib/cors.ts` y `CORS_ALLOW_ORIGINS` en `.env.example`/`env.ts`.
- QA Harness ahora valida Basic Auth en producción.
- Nuevo `PROD_PREFLIGHT.md` para despliegue/operación.

## P4.9 — Release Candidate hardening (validations + operable errors + prod preflight)

- Added standard API error helper with `errorCode` + `requestId` (`src/lib/apiErrors.ts`).
- Added payload size guards for sensitive endpoints (AI, reviews, quiz, newsletter, checkout, bot
  tools, wishlist).
- Standardized `errorCode` in common error responses (INVALID_INPUT, RATE_LIMITED,
  PAYLOAD_TOO_LARGE, NOT_FOUND).
- QA Harness now supports `mode=prod` (Production preflight) with stricter ENV/CORS checks.

## P4.10 — QA Pass 1 fixes + Smoke runner (2026-01-09)

### Fixes

- **CORS compatibility:** exported `corsPreflight` alias in `src/lib/cors.ts` so older routes
  importing `corsPreflight` build correctly.
- **API tours route:** removed duplicate `OPTIONS` export and dead `baseUrl()` helper in
  `src/app/api/tours/route.ts` (would break `next build`).
- **Availability API:** standardized `requestId` + `errorCode` shape and added CORS-aware headers in
  `src/app/api/availability/route.ts`.
- **QR API:** added `requestId` + standard JSON error shape in `src/app/api/qr/route.ts`.

### New

- **QA Pass 1 script:** `scripts/qa-pass1.mjs` + `npm run qa:pass1`.
- Documentation: `QA_PASS1.md`.

### What to run

```bash
npm run dev -- -p 3000
BASE_URL=http://localhost:3000 npm run qa:pass1
```

## 2026-01-10 — Progress 4

- Reescritura limpia del webhook de Stripe (idempotencia + booking upsert + email confirmación +
  actualización de deals y tareas).
- Checkout: metadata incluye deal_id y avanza stage a 'checkout' (best-effort).
- DB: migration idempotente para bookings.deal_id.
- Admin metrics: endpoint /api/admin/metrics/deals + UI integrada.
- AI: prompt mejorado (ventas consultivas + soporte humano + cierre con link Stripe).

## 2026-02-11 — P3.6 Events observability schema alignment

- DB: added optional columns to `public.events`: `source`, `entity_id`, `dedupe_key`.
- DB: added indexes + optional unique partial index for `(type, dedupe_key)`.
- Patch: `supabase_patch_p36_events_observability.sql` (safe to rerun).

Why: the app already logs structured events (`logEvent()`) and admin endpoints query events by
`entity_id`. Older DB installs without these columns will fail those queries.
