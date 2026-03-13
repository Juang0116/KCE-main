# P4.8 — Preflight de Producción (KCE 3.0)

Este runbook es el “último filtro” antes de hacer pruebas masivas o lanzar.

## 1) Variables de entorno (Vercel / Prod)

**Requeridas**

- `NEXT_PUBLIC_SITE_URL` (https://…)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM` (ej. `KCE <no-reply@kce.travel>`)
- `ADMIN_BASIC_USER`
- `ADMIN_BASIC_PASS`

**Opcionales (según features)**

- `CORS_ALLOW_ORIGINS` (solo si llamas APIs cross-origin)
- `OPENAI_API_KEY` / `GEMINI_API_KEY`
- Social URLs `NEXT_PUBLIC_SOCIAL_*`
- `ROBOTS_DISABLE_INDEXING=1` para preview

## 2) Supabase (Auth + Storage)

- Auth Redirect URLs:
  - `https://TU-DOMINIO/auth/callback`
  - `http://localhost:3000/auth/callback` (dev)
- Buckets esperados:
  - `review_avatars`
- RLS: confirmar que CRM/tickets/content es admin-only.

## 3) Stripe (Webhooks)

- Endpoint webhook: `https://TU-DOMINIO/api/webhooks/stripe`
- Eventos mínimos:
  - `checkout.session.completed`
- En local (puerto 3000):
  - `stripe listen --forward-to http://127.0.0.1:3000/api/webhooks/stripe`

## 4) QA Harness (obligatorio antes de pruebas)

- `GET /admin/qa` → “Run smoke tests”
- Debe estar todo en **OK** antes de ejecutar el Runbook.

## 5) Runbook de aceptación

- `GET /admin/runbook` → ejecutar pasos en orden:
  1. Tours
  2. Checkout + webhook + booking
  3. Invoice PDF + email
  4. Reviews + moderación
  5. CRM + tickets
  6. UTM funnel

### Preflight automatizado

- Abre `/admin/qa` y activa **Production preflight**.
- Ejecuta **Run checks**. Si todo queda en verde, procede con deploy.
- Opcional (Stripe network): `deep=1`.
