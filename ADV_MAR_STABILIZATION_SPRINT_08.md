# KCE March Stabilization Sprint 08

Este avance prioriza **estabilidad estructural** sobre parches aislados.

## Cambios principales

1. **Quiz API tipada**
   - `src/app/api/quiz/submit/route.ts`
   - se definió `TourRow`
   - `scoreTour()` ahora trabaja con tipo real y no con `any`

2. **Supabase Public tipado**
   - `src/lib/supabasePublic.ts`
   - `getSupabasePublic()` y `getSupabasePublicOptional()` ahora devuelven `SupabaseClient<Database>`

3. **RC Verify endurecido**
   - `src/app/api/admin/qa/rc-verify/route.ts`
   - `bookings.upsert(...)` ya usa `TablesInsert<'bookings'>`
   - `extras` ya usa `Json`
   - `fromTable(admin, 'bookings')` y `fromTable(admin, 'ops_incidents')`
   - helper `add()` omite `detail/meta` cuando vienen vacíos para respetar `exactOptionalPropertyTypes`

4. **Cobertura de tablas runtime / admin / ops / crm**
   - `src/types/supabase.ts`
   - se añadieron tablas faltantes con tipado laxo (`LooseRow`, `LooseInsert`, `LooseUpdate`)
   - objetivo: reducir errores `relation: never`, `.from('tabla')` no tipada y overload mismatch

5. **Auditoría local**
   - `scripts/audit-supabase-types.mjs`
   - `npm run audit:supabase-types`
   - genera `audit-supabase-types.json`

## Meta de este sprint

Reducir la fricción recurrente del build en:
- Admin
- Ops
- CRM
- Quiz
- rutas que dependen de tablas no alineadas con `src/types/supabase.ts`

## Siguiente fase recomendada

- ejecutar `npm run build`
- ejecutar `npm run audit:supabase-types`
- consolidar tipos reales de Supabase reemplazando progresivamente los `Loose*`
- luego volver a meter foco fuerte en UX premium, conversión y operación comercial
