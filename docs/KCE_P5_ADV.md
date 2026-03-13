# KCE — P5 (Autopilot Comercial)

Este avance convierte el CRM en un sistema *operativo* para no perder ventas por falta de seguimiento: crea tareas SLA/follow-up automáticamente y agrega un score/riesgo por deal en el Sales Cockpit.

## 1) Autopilot: creación automática de tareas por etapa

Endpoint:
- `POST /api/admin/sales/autopilot`

Body:
```json
{ "dryRun": false, "stage": "proposal", "limit": 200 }
```

Qué hace:
- Escanea deals activos (no `won/lost`) y crea tareas faltantes por etapa **sin duplicar** (dedupe por `title` con tareas `open/in_progress`).
- Se puede filtrar por `stage` (new/contacted/qualified/proposal/checkout).
- Devuelve resumen `{ dealsProcessed, tasksCreated }`.

Reglas (títulos = clave de dedupe):
- **new**: `Primer contacto (SLA 2h)`, `Follow-up lead (24h)`
- **contacted**: `Follow-up lead (24h)`, `Follow-up lead (48h)`
- **qualified**: `Enviar propuesta (SLA 2h)`, `Confirmar datos para propuesta (12h)`
- **proposal**: `Confirmar recepción de propuesta (24h)`, `Follow-up propuesta (48h)`
- **checkout**: `Enviar link de pago (checkout) al cliente`, `Follow-up pago (2h)`, `Follow-up pago (24h)`

## 2) Sales Cockpit: score + riesgo

Endpoint:
- `GET /api/admin/sales/cockpit`

Ahora agrega:
- `score` (0–100): combinación de etapa + amount + assigned + penalizaciones por stale/overdue.
- `risk`: lista de flags (p.ej. `tareas vencidas`, `deal estancado`, `checkout sin avance`, ...).

UI:
- `/admin/sales` muestra columnas nuevas **Score** y **Riesgo**.
- Botón **Autopilot** para ejecutar la creación de tareas desde el cockpit.

## 3) Recomendación operativa (rutina diaria)
- Abrir `/admin/sales` 2–3 veces al día.
- Click **Autopilot** (crea tareas faltantes).
- Priorizar deals con `tareas vencidas` + score alto (>=70) para cerrar rápido.

