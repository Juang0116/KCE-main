# KCE-main ADV MAR BUILD AUDIT 07

## Cambios principales

### 1) rc-verify: upsert de bookings tipado correctamente
Se corrigió `src/app/api/admin/qa/rc-verify/route.ts` para que el self-heal de bookings use:
- `TablesInsert<'bookings'>`
- `Json` para `extras`
- `fromTable(admin, 'bookings')` para preservar inferencia de Supabase
- fallback sin `deal_id` si la columna no existe en la BD real

Esto elimina el error de overload en:

```ts
.upsert(row, { onConflict: 'stripe_session_id' })
```

### 2) Ops incidents sin bloquear el build
`findLatestIncidentByKind()` ahora usa `getSupabaseAdminAny()` para tablas Ops no alineadas todavía en `src/types/supabase.ts`.

### 3) exactOptionalPropertyTypes endurecido
El helper `add(...)` ahora limpia `detail` y `meta` antes de empujar al arreglo `checks`, evitando futuros errores por `undefined` explícito.

## Lectura estratégica
El cuello de botella sigue siendo la desalineación entre:
- schema real de Supabase
- `src/types/supabase.ts`
- rutas Admin / Ops / CRM que asumen columnas/tablas runtime

## Siguiente gran avance recomendado
Hacer una fase dedicada de alineación tipada para:
- ops_incidents / ops_postmortems / ops_backups_log
- crm_sequences / crm_alert_rules / crm_alerts
- admin QA / revenue ops / playbooks
