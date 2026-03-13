# Deploy en Vercel (KCE)

Este repo está preparado para desplegar en **Vercel** (Next.js App Router).

## 1) Variables de entorno (Vercel)

Crea estas variables en: **Vercel → Project → Settings → Environment Variables**.

**Públicas (frontend):**

- `NEXT_PUBLIC_SITE_URL` (ej: `https://kce.vercel.app` o tu dominio)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Server-only (NO `NEXT_PUBLIC_`):**

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM` (ej: `KCE <no-reply@tu-dominio.com>`)

**Recomendadas (seguridad/SEO):**

- `LINK_TOKEN_SECRET` (>= 16 chars, recomendado 48+)
- `INTERNAL_API_KEY` (>= 16 chars, recomendado 48+)
- `ROBOTS_DISABLE_INDEXING` (pon `1` en preview/staging)

**Admin Basic Auth (P0):**

- `ADMIN_BASIC_USER`
- `ADMIN_BASIC_PASS`

> Recomendación: configura `ADMIN_BASIC_*` en **Production**.

## 2) Stripe Webhook

En Stripe → Developers → Webhooks:

- Endpoint: `https://TU_DOMINIO/api/webhooks/stripe`
- Eventos recomendados:
  - `checkout.session.completed`
  - `checkout.session.expired`

> Importante: `STRIPE_WEBHOOK_SECRET` debe corresponder al modo (test/live) de tu
> `STRIPE_SECRET_KEY`.

Copia el signing secret a `STRIPE_WEBHOOK_SECRET`.

## 3) SQL / Supabase

Para un entorno nuevo:

1. Aplica `supabase_schema.sql`
2. (Opcional) Aplica `supabase_seed.sql`

Para entornos existentes, aplica patches si aplica:

- `supabase_patch_p34_tickets_constraints.sql`
- `supabase_patch_p35_tickets_active_index.sql`

## 4) Smoke test (local)

```bash
export ADMIN_USER='juancho'
export ADMIN_PASS='...'
bash scripts/crm_smoke_test.sh
```
