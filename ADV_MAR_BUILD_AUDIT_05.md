# ADV MAR BUILD AUDIT 05

## Qué se corrigió

### 1) `src/app/api/admin/qa/rc-verify/route.ts`
- Se corrigió el problema con `exactOptionalPropertyTypes` en la estructura `Check`.
- En vez de empujar objetos con `detail: undefined` o `meta: undefined`, ahora el helper `add(...)` normaliza el payload y solo incluye las props opcionales cuando existen.
- Esto alinea `rc-verify` con el patrón defensivo que ya venía usando `src/app/api/admin/qa/run/route.ts`.

### 2) `bookings.upsert(...)`
- Se endureció el tipado del row para `bookings` con `TablesInsert<'bookings'>`.
- Se evita que TypeScript trate el payload como `Record<string, unknown>` y falle por campos requeridos (`date`, `persons`).

## Hallazgo de arquitectura
- La capa `admin/qa` está madura funcionalmente, pero no estaba homogénea en tipado estricto.
- `qa/run` ya tenía defensas pensadas para `exactOptionalPropertyTypes`; `rc-verify` estaba rezagado y por eso siguió rompiendo el build.

## Siguiente foco recomendado
1. Consolidar un helper reutilizable para checks QA (`makeCheck` o `pushCheck`).
2. Continuar alineando `src/types/supabase.ts` con Admin/Ops/CRM runtime.
3. Hacer una pasada por rutas con `.from('ops_*')`, `.from('crm_*')` y payloads con props opcionales.
