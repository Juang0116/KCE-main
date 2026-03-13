# P74 — Ops auto-escalation + weekly digest + action item due dates

Este paquete completa la capa de operación tipo *enterprise*:

## 1) Auto-escalation de SLA (ACK/RESOLVE)
- `checkIncidentSla()` ahora puede crear automáticamente:
  - un update en `ops_incident_updates` (timeline)
  - una tarea en `tasks`
- **Se habilita con:** `OPS_INCIDENT_AUTO_ESCALATE=1`
- Opcionalmente notifica por el canal de Ops Alerts si defines `OPS_INCIDENT_ESCALATION_EMAIL_TO`.

Env opcionales:
- `OPS_ESCALATION_ASSIGNEE` (nombre/email del responsable para asignar la tarea)

## 2) Action items con due date
En `/admin/ops/incidents/[id]` ahora hay editor de action items (título, owner, due, status).
- Botón **Crear tareas** sigue creando tareas y guardando `task_id` dentro del item.

## 3) Alertas: action items vencidos
`POST /api/admin/ops/alerts/run` ahora incluye `actionItems.overdue[]` y notifica por Ops Alerts.

## 4) Digest semanal
`POST /api/admin/ops/digest/cron` acepta `mode: weekly` y agrega sección:
- Top incident fingerprints (7d)

Ejemplo:
```bash
curl -X POST https://TU_DOMINIO.com/api/admin/ops/digest/cron \
  -H "authorization: Bearer $AUTOPILOT_API_TOKEN" \
  -H "content-type: application/json" \
  -d '{"mode":"weekly","dryRun":false}'
```
