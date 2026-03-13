# P48–P52 — Growth Core (A/B Templates + Outbound Closed-Loop + Conversion Hardening + Funnel Attribution)

## Qué habilita este bloque
- **P48**: A/B testing en `crm_templates` (columnas `variant`, `weight`) + winner locks.
- **P49**: Closed-loop outbound (marcar outcomes: replied/paid, atribuir booking a outbound).
- **P50**: Optimización automática (cron/admin) → winners + ajuste de weights.
- **P51**: Hardening de conversión (rate-limit, payload guard, Turnstile opcional, allowlist Origin/Referer).
- **P52**: Funnel attribution (UTM capture + view-tour + checkout started → métricas admin).

## SQL que debes ejecutar en Supabase (en orden)
1. `supabase_patch_p48_crm_templates_variants.sql`
2. `supabase_patch_p49_outbound_closed_loop.sql`
3. `supabase_patch_p50_template_optimization.sql`
4. `supabase_patch_p51_conversion_hardening.sql`
5. `supabase_patch_p52_funnel_attribution.sql`

> Si ya ejecutaste algunos, puedes re-ejecutarlos: son idempotentes (IF NOT EXISTS).

## Admin UI
- `/admin/templates`:
  - Editar `variant` y `weight`
  - Ver resumen performance: `/api/admin/templates/perf-summary`
  - Ejecutar optimización: botón **Optimizar A/B** (usa `/api/admin/templates/optimize`)

- `/admin/outbound`:
  - Ver cola/sent/failed + outcomes (replied/paid)

- `/admin/metrics`:
  - Funnel + UTM + outbound performance (según endpoints /api/admin/metrics/*)

## Cron (GitHub Actions / server-to-server)
Los cron endpoints están en:
- `POST /api/admin/outbound/cron`
- `POST /api/admin/sales/autopilot/cron`

Autenticación:
- **Recomendado**: `INTERNAL_HMAC_SECRET` + headers `x-kce-ts`/`x-kce-sig`
- **Compatibilidad**: `Authorization: Bearer $AUTOPILOT_API_TOKEN`

## Checklist de validación
1) Crea un template con key `checkout_followup`, variante A y B (weights diferentes).
2) Abre checkout desde un deal (o usa conversion followups).
3) Envía outbound (admin → send).
4) Marca reply/paid (closed-loop) y verifica métricas.
5) Ejecuta optimización A/B y confirma winner lock + weights.
