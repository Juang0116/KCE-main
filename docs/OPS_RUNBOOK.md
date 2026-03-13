# Ops Runbook (KCE)

Este documento describe el flujo operativo mínimo para que **KCE venda y atienda** rápido, con trazabilidad.

## 1) Página /admin/ops

La vista **Ops** es el tablero “Hoy” para:
- Tickets abiertos + urgentes.
- Tareas abiertas + vencidas + que vencen hoy.
- Conteo rápido de deals por stage.

**Uso recomendado (2–3 veces al día):**
1. Entrar a **/admin/ops**.
2. Atender **Overdue tasks** primero.
3. Revisar **Urgent tickets**.
4. Abrir **Deals board** y avanzar stages.

## 2) Tickets → Tareas (SLA)

Cada ticket nuevo crea una tarea automática:
- `Responder ticket (SLA)`
- due_at ≈ **2 horas** después

Esto evita que se “pierdan” conversaciones.

## 3) Deals Kanban

En **/admin/deals/board** puedes mover el stage en segundos.

Stages sugeridos:
- new
- contacted
- qualified
- proposal
- checkout
- won
- lost

Si tu BD tiene un CHECK distinto, aplica `supabase_patch_p44_deals_stages.sql`.

## 4) Tareas filtradas por ticket/deal

La página **/admin/tasks** acepta filtros vía querystring:
- `?ticket_id=<uuid>`
- `?deal_id=<uuid>`

Esto permite operar desde contexto (ticket/deal) sin perder tiempo.

## 5) KPIs mínimos (para meta MVP vendible)

- **SLA 1ª respuesta:** < 30 min (objetivo), < 2 h (mínimo).
- **Tasa de avance pipeline:** new → qualified en 24h.
- **Checkout rate:** qualified → checkout.
- **Postventa:** review + upsell dentro de 7 días.


## Outbound (Email/WhatsApp) — P9

### 1) Migración SQL
Ejecuta en Supabase (SQL Editor) en este orden:
1. `supabase_patch_p47_outbound_messages.sql`
2. `supabase_patch_p48_crm_templates_variants.sql`

### 2) Variables de entorno (Vercel)
- `CRON_SECRET` (puede ser el mismo valor de `AUTOPILOT_API_TOKEN`; alias legacy: `CRON_API_TOKEN`)
- `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` (ya existentes)

### 3) GitHub Actions (si quieres dispatcher automático)
Crea estos secrets en GitHub:
- `OUTBOUND_CRON_URL` = `https://<tu-dominio>/api/admin/outbound/cron`
- `AUTOPILOT_API_TOKEN` = el mismo token que usas para autopilot

El workflow `outbound-cron.yml` corre cada 10 minutos y envía emails en estado `queued`.

### 4) Uso (Admin)
- Admin → **Outbound**
  - Para WhatsApp: **Abrir WA** → enviar en WhatsApp → **Marcar enviado** (deja trazabilidad).
  - Para Email: puedes usar **Enviar email** (Resend) o seguir manual (mail client) y luego **Marcar enviado**.

### 5) Plantillas (A/B testing)
- `crm_templates` ahora soporta:
  - `variant` (ej: A, B)
  - `weight` (ej: 1, 2, 3...)
- El render elige variante de forma **determinística** por deal/ticket (seed) y registra `templateVariant` en eventos.
