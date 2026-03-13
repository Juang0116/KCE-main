# P73 — Ops Automation (action items → tasks, SLA, digest)

## 1) Action items → Tasks (postmortem)
En **/admin/ops/incidents/[id]** (detalle), en la sección *Postmortem*:

- Define **Action items** (title, owner opcional, due_at opcional).
- Click **Guardar**
- Click **Crear tareas**
  - Crea filas en `public.tasks` con título `[POSTMORTEM] ...`
  - Escribe `task_id` de vuelta dentro de `ops_postmortems.action_items` para evitar duplicados.

Endpoint:
- `POST /api/admin/ops/incidents/:id/postmortem/action-items/sync`

Requiere:
- Admin auth (Basic/cookie)
- Signed Actions si `SIGNED_ACTIONS_MODE != off`

## 2) SLA enforcement (ACK / Resolve)
Se evalúan SLAs y se notifican por `OPS_ALERT_*`.

Variables:
- `OPS_INCIDENT_ACK_SLA_MINUTES` (default 30)
- `OPS_INCIDENT_RESOLVE_SLA_MINUTES` (default 240)

Trigger:
- En **/admin/ops** → *Run alerts*
- o por API: `POST /api/admin/ops/alerts/run` (dryRun soportado)

Respuesta ahora incluye:
- `incidentSla.breaches[]`

## 3) Digest Ops (email)
Cron endpoint:
- `POST /api/admin/ops/digest/cron`

Auth:
- `authorization: Bearer <CRON_SECRET | AUTOPILOT_API_TOKEN>`
- Internal HMAC (si está requerido)

Body:
- `{ "days": 1, "dryRun": false }`

Env:
- `OPS_DIGEST_ENABLED=1` (por defecto es `0` — OFF; actívalo explícitamente)
- `OPS_DIGEST_EMAIL_TO=...` (fallback: `OPS_ALERT_EMAIL_TO`)
- `OPS_DIGEST_SUBJECT_PREFIX=[KCE Ops]`

El digest se encola en `crm_outbound_messages` como email.
