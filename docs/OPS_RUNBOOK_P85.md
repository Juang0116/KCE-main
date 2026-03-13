# OPS / Growth Runbook — P81→P85

Este bloque completa lo que faltaba para “internacional 10/10” en **go-to-market + compliance + performance**:

- **P81** Afiliados/partners (tracking + conversion capture)
- **P82** Playbook de lanzamientos (checklists por país/ciudad)
- **P83** Compliance: solicitudes de privacidad (export/delete)
- **P84** DR: log de backups y control operativo
- **P85** Performance: monitoring simple de navegación (TTFB/DOM/Load)

## 1) Patches SQL (ejecuta en orden)

1. `supabase_patch_p81_affiliates.sql`
2. `supabase_patch_p82_gotomarket_launches.sql`
3. `supabase_patch_p83_privacy_requests.sql`
4. `supabase_patch_p84_backups_log.sql`
5. `supabase_patch_p85_web_vitals.sql`

> Nota: todos usan `create table if not exists` para no romper si ya existen.

## 2) Afiliados (P81)

- Parametro en URL: `?ref=CODIGO`
- Cookie: `kce.ref`
- Endpoint click: `POST /api/affiliates/click` (se invoca desde frontend si quieres, pero ya con la cookie basta)
- Checkout agrega `affiliate_ref` en Stripe metadata y en eventos.
- Webhook captura `affiliate_ref` y crea `affiliate_conversions`.

Admin:
- `/admin/affiliates` (crear/listar)

## 3) Lanzamientos (P82)

Admin:
- `/admin/launches` (lista/estado)

Uso recomendado:
- Crea un launch por país/ciudad (p.e. "ES-Madrid Q2")
- Divide en items (landings, campañas, partners, contenido, ops).

## 4) Compliance (P83)

Public:
- `POST /api/privacy/request` `{ kind: 'export'|'delete', email, name?, message?, locale? }`

Admin:
- `/admin/privacy` (cola de solicitudes)
- `/api/admin/privacy/requests/:id` (PATCH status)

## 5) Backups / DR (P84)

Admin:
- `/admin/system/backups` (últimos logs)
- `POST /api/admin/ops/backups/run` (registra backup)

Ejemplo (manual):

```bash
curl -X POST https://TU_DOMINIO/api/admin/ops/backups/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic ..." \
  -H "x-admin-action-token: ..." \
  -d '{"kind":"db","provider":"supabase","location":"s3://...","ok":true,"message":"pg_dump nightly"}'
```

## 6) Performance (P85)

- `PerfReporter` manda un evento al endpoint `POST /api/track/perf` con métricas de navegación.

Admin:
- `/admin/analytics/performance`

