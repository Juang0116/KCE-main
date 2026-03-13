# P31 — Agent MVP

- `/api/ai`: si el usuario dice **pagar/checkout** y provee **fecha + personas**, el backend:
  - crea/reusa `deal` (checkout)
  - crea/reusa Stripe Checkout y guarda `stripe_session_id`/`checkout_url`
  - responde con link seguro `/go/checkout/[deal_id]?t=...`

Requisitos:
- Ejecutar SQL de deals existente (debe tener `stripe_session_id` y `checkout_url`).
- Definir `LINK_TOKEN_SECRET`.
