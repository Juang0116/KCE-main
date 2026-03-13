# KCE — Implementation Status (incremental)

Fecha: 2026-01-10

Este documento resume lo que se ha avanzado y lo que queda pendiente, sin bloquear el levantamiento.

## Completado (P0/P0.5)

- Legibilidad en modo claro: ajustes de tipografía/contrastes en páginas marketing y formularios.
- Header más limpio (menos saturación); redes sociales solo en el footer.
- Correcciones de rutas/errores: wishlist toggle, import/tipos en tour detail, props incoherentes en
  checkout success.
- CSP actualizado para permitir embeds/miniaturas de YouTube (vlog).
- Multidioma (routing): middleware con prefijo /es|/en|/fr|/de + selector de idioma (LocaleToggle)
  sin duplicar rutas.
- Reseñas premium: múltiples fotos (hasta 4), consentimiento de rostro, subida a Storage
  (`review_media`) por API y visualización pública/admin.
- SEO + i18n base: `src/i18n/dictionaries/*` + `generateMetadata()` locale-aware + sitemap por
  idioma.
- CRM base: tablas `deals`, `deal_notes`, `tasks` + admin UI (/admin/deals, /admin/tasks) + APIs
  (/api/admin/deals, /api/admin/tasks).

## Stripe (único método de pago)

### Implementado

- Checkout Sessions ahora usa:
  - `automatic_payment_methods: { enabled: true }`
  - `invoice_creation: { enabled: true }`
  - `allow_promotion_codes: true`
  - `billing_address_collection: 'auto'`

Endpoints:

- `src/app/api/checkout/route.ts`
- `src/app/api/bot/create-checkout/route.ts`

### Email de confirmación / factura

- Webhook mantiene PDF interno como **fallback**, pero si Stripe generó factura:
  - el email incluye botón **"Ver factura (Stripe)"** usando `hosted_invoice_url`.

Archivo:

- `src/app/api/webhooks/stripe/route.ts`

## Pendiente (para “meta completa”)

- IA vendedora/soporte 24/7: playbooks comerciales, tool-calling (recomendar→checkout), métricas.
- CRM “enterprise”: reglas SLA, asignación automática, automatizaciones (p.ej. recordatorios,
  follow-ups, estados post-compra).
- Multidioma ES/EN/FR/DE end-to-end: diccionarios + contenido traducible + SEO por idioma (routing
  ya está listo).
- Observabilidad avanzada: dashboards y limpieza/retención de `events`/`event_locks`.

## Recomendación de levantamiento

1. Aplicar schema/seed en Supabase.
2. Configurar envs (Stripe, Supabase, Resend).
3. Validar flujo E2E: Tours → Checkout → Webhook → Booking → Email/Factura.
4. Luego iterar P1/P2 (IA + CRM + analítica).
