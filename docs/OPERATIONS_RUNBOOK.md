# KCE — Operations Runbook (MVP)

Guía de operación para incidentes típicos en producción.

## Herramientas internas

- **/admin/ops**: health checks + últimos eventos.
- **/admin/events**: timeline forense por `session_id` o `entity_id`.
- **/admin/bookings**: lista de bookings (validación manual).
- Logs de proveedor: Stripe (webhooks), Resend (emails).

## Cómo diagnosticar (flujo estándar)

1. Obtener el `session_id` (`cs_...`) del usuario/Stripe.
2. Abrir **/admin/ops** y pegar el `cs_...` → ir a **/admin/events**.
3. Buscar en el timeline el primer error (`api.error`) o el evento que falta.
4. Confirmar estado en Supabase (bookings) y, si aplica, reintentar manualmente.

---

## Incidente A — Pago exitoso, pero no se crea booking

**Síntomas**

- Usuario pagó y tiene recibo, pero en KCE no aparece booking.

**Checks**

1. En Stripe → Webhooks: confirmar que el evento Live llegó al endpoint de producción.
2. Verificar variables en Vercel: `STRIPE_WEBHOOK_SECRET` y `STRIPE_SECRET_KEY`.
3. En **/admin/events** (por `session_id`): buscar `stripe.webhook.*`.

**Causas típicas**

- Webhook endpoint incorrecto (apunta a staging o viejo).
- Secret equivocado (test vs live).
- `SUPABASE_SERVICE_ROLE_KEY` ausente o incorrecta en producción.

**Acciones**

- Corregir env vars en Vercel (Production).
- Reenviar evento desde Stripe (retry / resend webhook event) si aplica.

---

## Incidente B — Booking existe, pero no llega email

**Checks**

1. En **/admin/events**: buscar `email.sent` o `api.error` relacionado.
2. En Resend: revisar logs/actividad para ese destinatario.
3. Verificar `RESEND_API_KEY` y el remitente configurado.

**Acciones**

- Si Resend está OK, revisar el template y errores en `api/email/booking-confirmation`.
- Reintentar envío (manual) si tienes endpoint interno o ejecutar el flujo nuevamente con una compra pequeña.

---

## Incidente C — Invoice PDF da 403

**Causa más común**

- Falta el token firmado `t` o hay mismatch de `LINK_TOKEN_SECRET`.

**Checks**

1. Confirmar que el link a invoice contiene `?t=...`.
2. En Vercel: `LINK_TOKEN_SECRET` debe estar en Production.
3. En **/admin/events**: buscar `invoice.*` y posibles `api.error`.

**Acciones**

- Re-deploy después de configurar env var.
- Revalidar con compra test real.

---

## Incidente D — Calendar ICS da 403

Mismo patrón que Invoice.

**Checks**

1. Link contiene `?t=...`.
2. `LINK_TOKEN_SECRET` en Production.
3. `api/account/calendar/[session_id]` responde 200 con token.

---

## Incidente E — Supabase health FAIL

**Checks**

- Endpoint `/api/health/supabase`.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.

**Acciones**

- Revisar env vars y rotación de keys.

---

## Incidente F — Compra redirige, pero booking page no carga

**Checks**

- Ver si la URL tiene `session_id`.
- Revisar logs en Vercel y `api/bookings/[session_id]`.

**Acciones**

- Revisar RLS/policies si se consulta con anon.
- Usar `supabaseAdmin` para lectura segura cuando la compra se valida por token.

---

## Reembolsos y soporte

Para reembolsar:

- Ejecutar refund en Stripe.
- Registrar nota en CRM (ticket) y, si aplica, marcar booking como `canceled/refunded` (según modelo de datos).

**Siempre** dejar trazabilidad en Events/Tickets.
