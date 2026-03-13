# ADV MAR STABILIZATION SPRINT 09

## Cambio principal
- `src/lib/supabaseTyped.server.ts` ahora tiene overload de `fromTable(...)`.
- Para tablas presentes en `Database['public']['Tables']`, conserva inferencia tipada.
- Para tablas runtime / SQL-first que todavía no estén sincronizadas en los tipos generados, hace fallback seguro al cliente base.

## Error que corrige
- `Argument of type "ops_incidents" is not assignable ...`

## Objetivo
- Evitar que Admin / Ops / CRM rompan el build cada vez que una tabla exista en Supabase pero todavía no haya quedado perfectamente reflejada en el union literal de `.from()`.

## Lectura estratégica
Este cambio no sustituye la regeneración oficial de tipos de Supabase, pero sí reduce mucho la fricción del build mientras el proyecto sigue avanzando.
