# P72 — Ops SRE-lite: Incidentes + Runbooks + Postmortems

Este bloque convierte los incidentes operativos (checkout / webhook / email / IA) en un proceso repetible:
- Dedupe + severidad
- SLA de ACK/Resolve
- Timeline (notas/acciones)
- Postmortem con action items
- Controles de mitigación (pausas/circuit breaker) desde Admin

## Definiciones de severidad (regla simple)
- **info**: ruido o fallo aislado sin impacto directo (monitorizar).
- **warn**: degradación parcial o riesgo de impacto (requiere ACK).
- **critical**: pagos/email/operación bloqueada o abuso activo (mitigar + resolver).

## SLA recomendado
- warn: ACK < 30 min, Resolve < 24 h
- critical: ACK < 10 min, Mitigación inmediata, Resolve < 4 h (o workaround)

## Flujo operativo
1. Ir a **/admin/ops/incidents**
2. Abrir un incidente y:
   - ACK (reconocer)
   - Agregar nota con hipótesis + próximos pasos (timeline)
   - Aplicar mitigación (pausar canal) si aplica
3. Resolver (Resolve) cuando:
   - el origen está corregido o mitigado
   - el sistema está estable (sin reaparición)
4. Crear Postmortem si severidad = critical o hubo impacto cliente:
   - Summary, Impact, Root cause, Timeline, Action items

## Mitigaciones (manuales)
- Pausar canal: checkout/email/ai/track (según configuración)
- Forzar evaluación de alertas/mitigaciones desde Admin (si habilitado)

## SQL requerido
Ejecuta en Supabase:
- `supabase_patch_p43_ops_incidents.sql` (si no existe)
- `supabase_patch_p72_incident_timeline.sql` (timeline + postmortem)
