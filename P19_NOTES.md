# P19 — Contenido + SEO + Social Proof + On-page instrumentation

Objetivo: reducir *high_reply_low_paid* atacando confianza y fricción en páginas clave (tour → checkout → success),
y habilitar medición por bloque/CTA (sin depender de adivinar).

## Cambios clave
- **TrustBar** reutilizable (pagos Stripe / factura / soporte + links a políticas/FAQ/contacto).
- **SocialProofStrip** (pruebas sociales rápidas) en tours, detalle y success.
- **Instrumentación P19**:
  - `ui.page.view`
  - `ui.block.view` (via IntersectionObserver)
  - `ui.cta.click` (checkout start + WhatsApp pre-checkout + continue to Stripe)
- **/api/track** público con rate limit (best-effort).
- **Admin Metrics**: nueva sección **On-page blocks** consumiendo `/api/admin/metrics/page-blocks`.

## Archivos nuevos
- `src/app/api/track/route.ts`
- `src/components/analytics/BlockTracker.tsx`
- `src/lib/track.client.ts`
- `src/features/marketing/TrustBar.tsx`
- `src/features/reviews/SocialProofStrip.tsx`
- `src/app/api/admin/metrics/page-blocks/route.ts`

## Archivos modificados
- `src/features/tours/components/BookingWidget.tsx`
- `src/app/(marketing)/tours/page.tsx`
- `src/app/(marketing)/tours/[slug]/page.tsx`
- `src/app/go/checkout/[deal_id]/route.ts`
- `src/app/(marketing)/checkout/success/page.tsx`
- `src/app/(marketing)/blog/page.tsx`
- `src/app/(marketing)/blog/[slug]/page.tsx`
- `src/app/admin/metrics/AdminMetricsClient.tsx`

## Validación rápida
1) Navega `/tours` y un tour específico, inicia checkout y usa WhatsApp.
2) Revisa `/admin/metrics` → **On-page blocks** para ver conteos.
