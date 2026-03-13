# KCE-main ADV MAR BUILD AUDIT 04

## Objetivo
Desbloquear el build en `src/app/api/admin/qa/rc-verify/route.ts` y reducir futuros errores de TypeScript causados por tablas Ops/Admin que existen en runtime pero no están modeladas todavía en `src/types/supabase.ts`.

## Cambios aplicados

### 1) Fix estructural en `rc-verify`
Archivo: `src/app/api/admin/qa/rc-verify/route.ts`

- `extras` ahora usa tipo `Json`
- `baseRow` y `row` ahora usan `TablesInsert<'bookings'>`
- se mantiene `upsert(..., { onConflict: 'stripe_session_id' })`
- `ops_incidents` ahora se consulta con helper loose para no romper el build mientras se alinean tipos

### 2) Nuevo helper de escape controlado
Archivo: `src/lib/supabaseLoose.server.ts`

Permite consultar tablas runtime no modeladas todavía en `src/types/supabase.ts` sin convertir todo el cliente admin a `any`.

### 3) Refuerzo de rutas críticas Ops/Admin
Se conectó el helper loose en rutas/servicios donde el proyecto depende de tablas `ops_*` y los tipos todavía no están completos.

## Archivos clave tocados
- `src/app/api/admin/qa/rc-verify/route.ts`
- `src/lib/supabaseLoose.server.ts`
- `src/app/api/admin/ops/backups/run/route.ts`
- `src/app/api/admin/ops/backups/status/route.ts`
- `src/app/api/admin/ops/incidents/[id]/ack/route.ts`
- `src/app/api/admin/ops/incidents/[id]/resolve/route.ts`
- `src/app/api/admin/ops/incidents/[id]/route.ts`
- `src/app/api/admin/ops/incidents/route.ts`
- `src/app/api/admin/ops/metrics/route.ts`
- `src/lib/incidentSla.server.ts`
- `src/lib/opsCircuitBreaker.server.ts`

## Recomendación siguiente fase
La solución realmente definitiva es regenerar/alinear `src/types/supabase.ts` con el schema real de Supabase para CRM/Ops/Admin.

Mientras tanto, este avance debe reducir bastante la cascada de errores `relation: never`, overload mismatch y `.from('ops_*')`.
