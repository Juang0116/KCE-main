# KCE Release Candidate 104

## Objetivo
Cerrar la fase de **QA / launch readiness** para que KCE se lea y opere más como una empresa lista para lanzar, no solo como una web avanzada.

## Qué se reforzó
- Admin QA con tablero de **go / no-go**.
- Auditoría manual de rutas públicas clave.
- Checklist de release candidate visible dentro de `/admin/qa`.
- Enfoque explícito en revenue truth, continuity truth y recovery truth.

## Qué revisar antes de mover tráfico
1. `npm run build`
2. `npm run qa:ci`
3. `npm run qa:smoke`
4. Compra real o session_id reciente en RC Verify
5. Revisión manual de:
   - Home
   - Tours
   - Detail
   - Plan personalizado
   - Contacto
   - Chat
   - Booking
   - Account
6. Confirmar booking, invoice y email
7. Confirmar continuidad entre chat / contacto / CRM
8. Confirmar soporte y recovery path

## Criterio de salida
- **Go**: QA técnico + RC Verify + revisión manual del front premium.
- **No-go**: si falla booking, links firmados, email o continuidad crítica.
- **Monitor**: si lo técnico pasó, pero todavía falta revisión manual.
- **Recover**: si hay huecos puntuales, usar heal booking / resend email / runbooks antes de empujar más presión comercial.
