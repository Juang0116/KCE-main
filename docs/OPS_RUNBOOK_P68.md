# P68 — Operación + CRM + Outbound (Runbook)

Este paquete consolida los **pasos 6–8** del plan macro: Operación, CRM y Outbound.

## 6) Operación (post-venta)

### Objetivo
Que cada compra tenga un flujo operacional claro: confirmación, soporte, cambio/cancelación, y (si aplica) reembolso/voucher.

### Ya existe en el proyecto
- **Cuenta del cliente**: `/account/bookings` y `/account/support`.
- **Sistema de tickets**: `/admin/tickets` + conversaciones.
- **Logs/observabilidad**: tabla `events` + locks `event_locks`.
- **Facturación / calendar / link tokens**: endpoints `/api/account/*`.

### Nuevo (DB)
Ejecuta el SQL:
- `supabase_patch_p64_bookings_ops.sql`
  - Añade columnas de operación a `bookings` (cancel/reschedule/refund/voucher/ops_notes).

### Políticas y UX recomendadas
- CTA visible en Booking/Account: **“Solicitar cambio/cancelación”** → crea ticket.
- SLA: primera respuesta en ≤ 4h (horario laboral).
- Reembolsos: informar ventana bancaria 5–10 días hábiles.

## 7) CRM (daily driver)

### Ya existe
- **Deals pipeline** y **Tasks**.
- **Autopilot cron**: `/api/admin/sales/autopilot/cron` (con HMAC + token)
  - Crea tareas por etapa, ejecuta triggers outbound, optimiza variantes de templates.

### Checklist diario
- Revisar **Tasks**: `/admin/tasks`
- Revisar **Tickets**: `/admin/tickets`
- Revisar **Outbound queue**: `/admin/outbound`

## 8) Outbound (secuencias)

### Ya existe
- **Cola outbound**: `crm_outbound_messages`.
- Envío automático de emails (cron): `/api/admin/outbound/cron`.
- Followups para checkout cohort (manual): `/api/admin/sales/followups/run`.

### Nuevo (Templates Ops)
Ejecuta el SQL:
- `supabase_patch_p65_ops_templates_seed.sql`
  - Crea templates base para: cancelación, cambio de fecha, reembolso (email + whatsapp).

### Cómo usar WhatsApp sin proveedor
- En Admin → Outbound, canal `whatsapp` genera un link `wa.me` (click-to-chat).

## Variables de entorno mínimas
- `AUTOPILOT_API_TOKEN`
- `CRON_SECRET` (o reutiliza el mismo)
- `INTERNAL_HMAC_SECRET`
- `RESEND_API_KEY`

## Próximo paso recomendado
- Activar cron jobs en Vercel (o GitHub Actions) para:
  1) Autopilot cron (tareas + triggers)
  2) Outbound cron (enviar emails)
  3) Followups cron (checkout cohort) — opcional
