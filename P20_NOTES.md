# P20 — SEO + Proof Stack + On-page Tracking (cumulative)

## Objetivo (KCE Completo)
Reducir el *high_reply_low_paid* desde producto/UX y habilitar SEO/medición con estándares “production-grade”.

## Features
- **Proof Stack A/B por cohort** (estable semanalmente por `kce_vid` + ISO week)
  - Variantes A/B para orden de *trust → objeciones → FAQ*.
  - Override rápido (winner lock manual): `SITE_PROOFSTACK_VARIANT=A|B`
- **TrustBar** (Stripe / factura / cancelación / soporte)
- **Tracking** (best-effort + rate limit) hacia `events`
  - `POST /api/track` → `ui.page.view`, `ui.block.view`, `ui.cta.click`
  - `BlockTracker` para medir visibilidad de secciones
- **SEO**
  - `src/app/sitemap.ts` y `src/app/robots.ts`
  - JSON-LD básico de Organization en `src/app/layout.tsx`
- Policy nueva: `/policies/payments`

## Env vars recomendadas
- `NEXT_PUBLIC_SITE_URL` (o `SITE_URL`)
- `SITE_PROOFSTACK_VARIANT` (opcional: A/B)
