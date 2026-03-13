# ADV MAR STABILIZATION SPRINT 13

## Fix aplicado
- Se corrigió `src/types/supabase.ts` eliminando definiciones duplicadas dentro de `Database['public']['Tables']` para:
  - `crm_templates`
  - `crm_outbound_messages`
  - `crm_template_winner_locks`

## Causa
Estas tablas ya tenían una definición fuerte más arriba en el archivo y también aparecían otra vez en el bloque `Loose*`, lo que provocaba el error de TypeScript `Duplicate identifier`.

## Efecto esperado
- Desbloquear el build en `src/types/supabase.ts`.
- Mantener las definiciones fuertes para esas tablas, sin degradarlas al fallback `LooseRow/LooseInsert/LooseUpdate`.
