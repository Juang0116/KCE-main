# Phase 4 QA Checklist

## Funnel crítico
- Checkout normal crea sesión Stripe
- Bot checkout crea sesión Stripe
- Redirect success conserva locale
- Redirect cancel vuelve a página esperada
- Webhook Stripe crea/actualiza booking
- Booking page abre con token firmado
- Invoice PDF abre con token firmado
- Email de confirmación llega con factura

## Hardening
- /api/health* responde 403 sin HEALTHCHECK_TOKEN en producción
- Admin no entra sin token si ADMIN_DEV_OPEN=0
- Formularios públicos fallan sin Turnstile
- Formularios públicos fallan con Origin inválido

## PWA
- /manifest.webmanifest responde 200
- /site.webmanifest responde 200
- /icons/icon-192.png responde 200
- /icons/icon-512.png responde 200

## Smoke
- npm run build
- npm run qa:smoke
- flujo E2E mínimo: tour -> checkout -> webhook -> booking -> invoice
