# P6 — Autopilot 24/7 (Scheduler seguro)

## Objetivo
Que el CRM cree tareas SLA/follow-up **automáticamente cada 2 horas**, sin depender de que alguien presione el botón “Autopilot” en la UI.

## Cómo funciona
- Endpoint seguro (server): `POST /api/admin/sales/autopilot/cron`
- Autenticación: `Authorization: Bearer $AUTOPILOT_API_TOKEN`
- Protección anti-overlap: usa `event_locks` con key `cron:autopilot` (TTL 15 min).

## Setup en GitHub Actions (recomendado)
Este repo incluye el workflow:
- `.github/workflows/autopilot-cron.yml`

### 1) Crea los secrets en GitHub
En tu repo (Settings → Secrets and variables → Actions → New repository secret):

- `AUTOPILOT_API_TOKEN` → un token largo aleatorio (32+ chars)
- `AUTOPILOT_CRON_URL` → tu endpoint prod, por ejemplo:
  - `https://knowingcultures.vercel.app/api/admin/sales/autopilot/cron`

### 2) Configura el mismo token en Vercel
En Vercel → Project → Settings → Environment Variables:

- `AUTOPILOT_API_TOKEN` = (mismo valor del secret)

### 3) Validación
- Ve a GitHub → Actions → `KCE Autopilot Cron` → Run workflow.
- Debe responder 200 y en Supabase aparecer nuevas tareas (si faltaban).

## Local / staging
Puedes probar con curl:

```bash
curl -X POST "http://localhost:3000/api/admin/sales/autopilot/cron" \
  -H "Authorization: Bearer $AUTOPILOT_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"limit":200,"dryRun":false}'
```

## Nota de seguridad
Este endpoint **no usa Basic Auth** a propósito (para que un scheduler lo pueda llamar), así que:
- Mantén el token fuera del código (solo env/secrets)
- Rota el token si sospechas fuga
