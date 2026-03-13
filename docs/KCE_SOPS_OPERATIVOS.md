# KCE — SOPs Operativos
> Versión viva. Actualizar cada vez que cambie un proceso real.

---

## SOP 1 — Lead nuevo entrante

**Cuándo aplica:** Cada vez que llega un contacto por chat, formulario /plan, /contact, WhatsApp o email.

**Pasos:**
1. Verificar que el lead existe en CRM (admin → leads).
2. Si no existe: crear con nombre, email/WA, origen y resumen del contexto.
3. Clasificar intención:
   - `tour_interest` → abrir deal en pipeline comercial.
   - `plan_request` → abrir task de seguimiento + marcar deal en etapa "Calificación".
   - `support` → abrir ticket, no deal.
   - `general_inquiry` → responder y ver si convierte.
4. Asignar SLA de respuesta:
   - Chat en vivo: ≤ 2 horas.
   - Formulario /plan: ≤ 4 horas.
   - Email/WA: ≤ 8 horas.
5. Añadir nota interna con contexto: ciudad, fechas, personas, presupuesto, idioma.

**Regla de oro:** Nunca dejar un lead sin siguiente acción asignada.

---

## SOP 2 — Recomendación y propuesta

**Cuándo aplica:** Lead calificado con contexto suficiente para recomendar.

**Pasos:**
1. Verificar contexto mínimo: ciudad base + intereses + número de personas.
2. Seleccionar 2-3 tours del catálogo que encajen (no improvisar fuera del catálogo).
3. Preparar propuesta con:
   - Nombre + slug del tour.
   - Por qué encaja para este viajero específico.
   - Precio desde (nunca precio exacto sin confirmar disponibilidad).
   - Próximo paso concreto: ver detalle, confirmar fecha o pasar a checkout.
4. Enviar por el canal donde llegó el lead (mismo hilo).
5. Actualizar deal a etapa "Propuesta enviada".
6. Crear task de seguimiento: ≤ 48h si no responde.

**Regla de oro:** La propuesta es para este viajero, no genérica. Personaliza al menos una frase por tour.

---

## SOP 3 — Booking confirmado (post-pago)

**Cuándo aplica:** Stripe webhook recibe `payment_intent.succeeded` o `checkout.session.completed`.

**Pasos automáticos (sistema):**
1. Crear booking en base de datos con estado `confirmed`.
2. Generar invoice.
3. Enviar email de confirmación con: booking ID, invoice, fechas, detalle del tour, contacto de soporte.
4. Actualizar deal a "Cerrado ganado".
5. Registrar evento en timeline.

**Pasos manuales (operación):**
1. Verificar que el email llegó (revisar eventos → `booking.confirmed`).
2. Si hay guía o proveedor: notificarles en ≤ 24h con detalles del grupo.
3. Añadir nota interna: datos especiales, alergias, idioma, necesidades del grupo.
4. Crear task de follow-up: contactar al viajero 48h antes del tour.

**Regla de oro:** Si el webhook falla, revisar admin → eventos antes de reenviar manualmente.

---

## SOP 4 — Soporte e incidencias

**Cuándo aplica:** Cualquier problema reportado por un viajero (pago, booking, logística, calidad).

**Pasos:**
1. Leer contexto completo: ¿hay booking? ¿hay ticket anterior? ¿cuál es el canal?
2. Abrir ticket si no existe. Nunca manejar soporte solo por chat flotante.
3. Respuesta inicial ≤ 1h con: acuse de recibo + timeframe de resolución + nombre de quien atiende.
4. Clasificar gravedad:
   - `crítico` (pago fallido, tour no operado, emergencia): escalar al fundador inmediatamente.
   - `alto` (booking incorrecto, email no llegó): resolver en ≤ 4h.
   - `normal` (duda logística, cambio de fecha, info adicional): resolver en ≤ 24h.
5. Resolver y documentar solución en el ticket.
6. Cerrar ticket con confirmación del viajero cuando sea posible.
7. Si fue error de KCE: añadir nota interna para mejora de proceso.

**Regla de oro:** Un solo hilo por caso. No abrir canales paralelos. No prometer refunds sin autorización del fundador.

---

## SOP 5 — Coordinación con guías y proveedores

**Cuándo aplica:** Booking confirmado que involucra guía externo, conductor, o proveedor aliado.

**Pasos:**
1. Notificar al guía/proveedor con: fecha, hora, punto de encuentro, número de personas, idioma del grupo, contacto del cliente.
2. Confirmar recepción por parte del proveedor en ≤ 12h.
3. Si no confirma: escalar y buscar alternativa antes de las 48h previas al tour.
4. Día anterior: recordatorio al guía y al viajero.
5. Día del tour: disponible por WhatsApp para incidencias.
6. Post-tour: solicitar reseña al viajero y feedback al guía.

**Regla de oro:** Nunca confirmar al viajero sin haber confirmado primero con el proveedor.

---

## SOP 6 — Reseña y cierre de caso

**Cuándo aplica:** 24-48h después de que el tour se completó.

**Pasos:**
1. Enviar mensaje de seguimiento: ¿cómo estuvo la experiencia?
2. Si positivo: solicitar reseña en la plataforma correspondiente.
3. Si negativo: abrir ticket de soporte post-tour y atender antes de pedir reseña.
4. Registrar feedback interno (qué salió bien, qué mejorar).
5. Cerrar deal con resultado y nota de calidad.
6. Si el viajero muestra interés en otro tour: iniciar nuevo ciclo comercial.

---

## SOP 7 — Prioridades del fundador

**Cuándo responder en ≤ 2 horas:**
- Pagos fallidos o cobros duplicados.
- Tour no operado o proveedor que no apareció.
- Emergencia durante el tour.
- Lead de alto valor o grupo grande (≥8 personas, presupuesto premium).

**Cuándo responder en ≤ 12 horas:**
- Nuevos leads con contexto claro.
- Tickets de soporte nivel alto.
- Confirmaciones de proveedor pendientes.

**Cuándo delegar al sistema / equipo:**
- Soporte nivel normal (dudas logísticas, info del tour).
- Seguimiento de leads en etapas tempranas.
- Reseñas post-tour.

---

## SOP 8 — Mantenimiento semanal del sistema

**Cada lunes:**
- Revisar pipeline: deals atascados por más de 5 días → reactivar o archivar.
- Revisar tickets abiertos: asignar o cerrar los que llevan más de 48h sin actividad.
- Revisar leads sin follow-up en los últimos 3 días.

**Cada viernes:**
- Revisar revenue de la semana (admin → analytics).
- Verificar que todos los bookings confirmados tienen guía asignado.
- Revisar alertas del sistema (admin → eventos de seguridad, errores de webhook).

**Mensual:**
- Revisar catálogo: ¿hay tours que no se están vendiendo? ¿hay tours que necesitan actualización de precio?
- Revisar base de aliados: confirmar disponibilidad para próximo mes.
- Backup de Supabase verificado.

---

## Contactos de emergencia internos

> Llenar con datos reales antes del lanzamiento.

| Rol | Nombre | WhatsApp | Email |
|-----|--------|----------|-------|
| Fundador / Dirección | — | — | — |
| Soporte operativo | — | — | — |
| Guía Bogotá principal | — | — | — |
| Guía La Victoria principal | — | — | — |
| Proveedor transporte | — | — | — |

---

*Última actualización: Phase 120 — KCE*
