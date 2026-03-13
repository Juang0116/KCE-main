# ADV MAR BUILD AUDIT 03

## Objetivo
Reducir los siguientes bloqueos de TypeScript por tablas Supabase usadas en runtime pero ausentes en `src/types/supabase.ts`.

## Cambios
- Se añadieron tipos `LooseRow`, `LooseInsert`, `LooseUpdate` en `src/types/supabase.ts`.
- Se registraron 37 tablas runtime/Admin/Ops/CRM que estaban siendo usadas en `.from('table')` pero no existían en el union tipado de `Database['public']['Tables']`.
- Con esto desaparece el patrón de error:
  - `Argument of type '"ops_incidents"' is not assignable ...`
  - `relation: never`

## Nota
Esto **no sustituye** la generación oficial de tipos desde Supabase. Es una capa de compatibilidad para acelerar builds y evitar cascadas de errores mientras se alinea la base real con el código.

## Próximo paso recomendado
Generar tipos reales desde Supabase y reemplazar gradualmente estas tablas loose por contratos estrictos empezando por:
1. ops_incidents / ops_incident_updates / ops_postmortems
2. crm_sequences / crm_sequence_steps / crm_sequence_enrollments
3. crm_runtime_flags / crm_alerts / crm_alert_rules
4. ops_backups_log / marketing_spend_daily / affiliates
