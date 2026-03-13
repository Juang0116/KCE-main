# ADV MAR Build Audit 02

## Qué se corrigió

### 1) `rc-verify` tipado correctamente para `bookings`
Se corrigió `src/app/api/admin/qa/rc-verify/route.ts` para que el `upsert` use un payload con tipo real de Supabase (`Database['public']['Tables']['bookings']['Insert']`) en vez de `Record<string, unknown>`.

También se tipó `extras` como `Json` y se cambió el acceso a `.from('bookings')` por el helper `fromTable(...)` para mantener inferencia literal del nombre de tabla.

## Qué se auditó

Se hizo una verificación estructural rápida entre:
- tablas usadas en el código mediante `.from('table')`
- tablas declaradas en `src/types/supabase.ts`

### Resultado del barrido
- Tablas declaradas en tipos: **23**
- Tablas usadas en el código: **60**
- Tablas usadas pero no tipadas en `src/types/supabase.ts`: **40**

## Riesgo real detectado

El principal riesgo de builds futuros no es el frontend marketing ahora mismo.
El riesgo más grande está en **desalineación entre la base de datos real y los tipos TypeScript de Supabase**.

Eso explica por qué aparecen errores tipo:
- `never`
- overload mismatch en `.insert/.upsert/.update`
- propiedades no existentes en payloads
- necesidad de `as any` en varias rutas admin/ops/crm

## Tablas faltantes más sensibles

Las áreas más críticas por impacto de negocio/operación son:

- `crm_templates`
- `crm_sequences`
- `crm_sequence_steps`
- `crm_sequence_enrollments`
- `crm_roles`
- `crm_role_bindings`
- `crm_breakglass_tokens`
- `ops_backups_log`
- `ops_incidents`
- `ops_postmortems`
- `admin_audit_events`
- `security_events`
- `privacy_requests`
- `tour_pricing_rules`
- `affiliates`

## Avance agregado

Se añadió el script:

```bash
npm run audit:supabase-types
```

Este script genera un reporte local `audit-supabase-types.json` para detectar automáticamente tablas usadas en código que no estén declaradas en `src/types/supabase.ts`.

## Recomendación siguiente

Para estabilizar el proyecto de verdad y reducir regresiones de build, el siguiente avance grande debería ser:

1. regenerar o ampliar `src/types/supabase.ts`
2. cubrir primero tablas críticas de CRM / Ops / Admin
3. reemplazar `as any` donde ya existan tipos correctos
4. volver a correr build y typecheck

## Meta técnica

Pasar de hotfixes sueltos a una base donde:
- el marketing compile limpio
- los endpoints admin críticos compilen limpio
- Supabase tenga tipos alineados con el schema real
- los próximos avances grandes no se frenen por errores repetitivos de tipado
