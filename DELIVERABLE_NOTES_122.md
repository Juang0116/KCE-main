# KCE Phase 122 — Deliverable Notes

**Date:** 2026-03-14
**Phase:** 122 — Agente de Seguimiento Automático (Follow-up Agent)
**Status:** ✅ Complete

---

## Resumen

Phase 122 activa el agente de seguimiento automático para leads que no reservan después de enviar el formulario de plan. El motor ya existía (`sequences.server.ts`, `outbound.server.ts`) pero no había enrollment automático, ni crons programados, ni cancelación al convertir.

---

## Piezas construidas

### 1. `src/lib/followupAgent.server.ts` (nuevo — 245 líneas)
Agente central. Funciones:
- `enrollLeadInFollowupSequence()` — enrolla el lead en la secuencia `kce.plan.no_response.v1`. Auto-siembra la secuencia en DB si no existe (idempotente). Previene doble-enrollment.
- `cancelFollowupOnBooking()` — cancela todos los enrollments activos cuando el lead convierte.

**Secuencia sembrada automáticamente:**
| Paso | Delay | Canal | Asunto |
|------|-------|-------|--------|
| 0 | 2h | Email | Tu plan de viaje KCE está listo 🗺️ |
| 1 | 24h | Email | Tu itinerario KCE sigue disponible ✈️ |
| 2 | 72h | Email | ¿Seguimos con tu plan de Colombia? 🌿 |

### 2. `quiz/submit/route.ts` — auto-enrollment
Después de crear el deal, llama `enrollLeadInFollowupSequence()` en fire-and-forget (`void`). Si falla, no rompe la respuesta al usuario.

### 3. `webhooks/stripe/route.ts` — cancel on booking
En `checkout.session.completed` (pagado), llama `cancelFollowupOnBooking()` usando `session.metadata.deal_id` / `session.metadata.lead_id`. Lead que paga sale de la secuencia.

### 4. `vercel.json` (nuevo)
Crons programados en Vercel:
| Endpoint | Schedule | Propósito |
|----------|----------|-----------|
| `/api/admin/sequences/cron` | cada 15 min | Dispara steps pendientes |
| `/api/admin/outbound/cron` | cada 10 min | Envía emails encolados |
| `/api/admin/sales/autopilot/cron` | cada hora | Autopilot de deals |
| `/api/admin/metrics/alerts/cron` | 8am diario | Alertas de métricas |
| `/api/admin/ops/digest/cron` | 9am lunes | Digest semanal de ops |

### 5. `sequences/cron/route.ts` — Vercel-compatible auth
Ahora acepta el header `x-vercel-cron: 1` (lo envía Vercel automáticamente) además de Bearer token y HMAC. Body vacío ya no falla.

### 6. `sequences/enrollments/route.ts` (nuevo)
`GET /api/admin/sequences/enrollments` — lista enrollments activos con `next_run_at`, `current_step`, city del metadata, errores.

### 7. `sequences/route.ts` — enrollment stats en listado
`GET /api/admin/sequences` ahora incluye `enrollments: { active, completed, failed }` por secuencia.

### 8. `AdminSequencesClient.tsx` — cola activa visible
Panel "Cola activa" en el admin de sequences: botón "Ver cola" carga los enrollments activos con step, ciudad, próxima ejecución y errores.

### 9. `supabase_patch_p91_followup_sequences_seed.sql` (nuevo)
Siembra la secuencia y sus 3 pasos directamente en Supabase (belt-and-suspenders junto a la auto-seed en código).

---

## Flujo completo después de Phase 122

```
Lead envía /plan
  ↓ quiz/submit → CRM (lead + deal + task)
  ↓ enrollLeadInFollowupSequence() → crm_sequence_enrollments (next_run_at = now + 2h)

Vercel cron (cada 15 min) → /api/admin/sequences/cron
  ↓ runSequenceCron() → busca enrollments con next_run_at ≤ now
  ↓ crea crm_outbound_messages (status: 'queued')

Vercel cron (cada 10 min) → /api/admin/outbound/cron
  ↓ processOutboundQueue() → envía emails via Resend
  ↓ avanza enrollment al siguiente paso

Lead paga → Stripe webhook → checkout.session.completed
  ↓ cancelFollowupOnBooking() → enrollment.status = 'canceled'
```

---

## Variables de entorno requeridas (sin cambios)
```
CRON_SECRET=<token fuerte>          # Bearer para crons si no usas x-vercel-cron
RESEND_API_KEY=<key>                # Para enviar emails
EMAIL_FROM=hello@kce.travel         # Remitente
NEXT_PUBLIC_SITE_URL=https://kce.travel
```

---

## Pre-production checklist
- [ ] Ejecutar `supabase_patch_p91_followup_sequences_seed.sql` en Supabase
- [ ] Verificar en admin `/admin/sequences` que aparece la secuencia `kce.plan.no_response.v1`
- [ ] Enviar un plan de prueba → verificar enrollment en la cola
- [ ] En Vercel: Settings → Crons → confirmar 5 crons activos
- [ ] 2h después: verificar que el email paso 0 llegó
