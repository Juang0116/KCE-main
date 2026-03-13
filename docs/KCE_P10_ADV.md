# KCE — P10 (Triggers + Anti-spam + Outbound Performance)

Fecha: 2026-02-15

## Qué agrega P10

### 1) Triggers automáticos (Outbound)
Se ejecutan desde el cron de Autopilot (cada 2 horas) y NO requieren intervención manual.

Reglas:
- **Checkout sin pago**: si un deal está en `checkout` y no se ha cerrado (`closed_at IS NULL`) y `updated_at` es mayor a `CRM_CHECKOUT_UNPAID_AFTER_HOURS` (default 2h), se encola un recordatorio.
- **Ticket esperando cliente**: si un ticket está `open/pending/in_progress` y la conversación está esperando respuesta del cliente por más de `CRM_WAITING_CUSTOMER_AFTER_HOURS` (default 24h), se encola un ping (usa el deal activo del lead/cliente).

### 2) Anti-spam
Antes de encolar un mensaje:
- No debe existir un mensaje `queued/sending` para el mismo deal+canal.
- No se encola si hubo un mensaje `queued/sending/sent` en las últimas `CRM_OUTBOUND_MIN_INTERVAL_HOURS` (default 8h).
- Máximo `CRM_OUTBOUND_MAX_PER_7D` (default 3) por deal+canal en 7 días.

### 3) Enqueue por cambio de etapa (stage transition)
Cuando un admin cambia `stage` en un deal (`PATCH /api/admin/deals/[id]`), se encola (best-effort) un mensaje para etapas:
- contacted / qualified / proposal / checkout

### 4) Métrica Outbound (A/B)
Nuevo endpoint:
- `/api/admin/metrics/outbound-performance?days=30`

Admin UI:
- `/admin/metrics` incluye tabla por template/variante/canal con:
  - queued / sent / failed
  - `won <= 7d` (conversión aproximada por deal)

## Variables opcionales (todas con default)
- `CRM_OUTBOUND_MIN_INTERVAL_HOURS` (8)
- `CRM_OUTBOUND_MAX_PER_7D` (3)
- `CRM_CHECKOUT_UNPAID_AFTER_HOURS` (2)
- `CRM_WAITING_CUSTOMER_AFTER_HOURS` (24)
