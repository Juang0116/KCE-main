# KCE 3.0 — Runbook de aceptación (manual)

Este runbook está pensado para ejecutar **pruebas de aceptación** de forma repetible y con
trazabilidad en `events`.

## Dónde está

- UI: `/admin/runbook`
- Logging: `POST /api/admin/runbook/log` (escribe `events.type = qa.runbook_step`)

## Cómo usar

1. Ejecuta primero **Smoke tests**:
   - `/admin/qa` → **Run checks** (corrige FAIL antes de seguir)

2. Abre el runbook:
   - `/admin/runbook`
   - Inicia un **Nuevo run** si quieres un ID limpio.

3. Ejecuta los pasos en orden y marca:
   - **PASS** si el criterio se cumple.
   - **FAIL** si falla; escribe `session_id`, `request_id`, URLs o mensajes de error en “Notas”.

4. (Recomendado) Deja activado **Log a events**:
   - Cada cambio de estado se registra con `dedupe_key = runbook:{runId}:{stepId}:{status}`.
   - Esto te permite reconstruir un test run completo desde `events`.

## Qué valida

El runbook cubre:

- Catálogo y detalle de tours (DB real)
- Captura UTM y métricas
- Checkout iniciado y pago confirmado (webhook) + booking
- Invoice/email
- Reviews (pending → approve)
- CRM (lead/customer)
- Bot handoff a ticket

## Buenas prácticas

- Ejecuta siempre con una URL con UTM para probar atribución:
  - `/tours?utm_source=ig&utm_medium=social&utm_campaign=qa`
- Si un paso falla, **no avances** al siguiente hasta identificar la causa o registrar un ticket
  interno.
