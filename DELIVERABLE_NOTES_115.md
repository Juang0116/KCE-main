# Phase 115 — Launch-command phase

## Qué quedó aplicado
- Nuevo componente `LaunchCommandContinuityRail` para repetir continuidad account / bookings / support / contact en la superficie traveler.
- `/account` y `/account/bookings` ahora muestran esta capa de command continuity.
- `/account/support` ahora funciona como un centro más listo para salida real: hero más claro + contexto importado visible + quick links a bookings/contact.
- `/account/support/[id]` ahora envuelve el hilo del ticket con continuidad hacia reservas y contacto.
- `SupportCenter` acepta y muestra mejor `bookingId`, `subject`, `message`, `source` y `ticket` desde query params.
- `TicketThread` fue pulido para dejar más clara la continuidad del caso.
- `ChatWidget` ahora conserva `conversationId` en el enlace a contacto y añade acceso más directo a ticket activo y bookings hub.
- `/api/ai` ahora añade un bloque de continuidad más útil cuando crea ticket humano.
- `/contact` ahora reconoce `ticket` y `conversation` como parte del contexto comercial/humano.

## Gate sugerido
- Validar `npm run build`.
- QA manual de: `/account`, `/account/bookings`, `/account/support`, `/account/support/[id]`, `/contact`, `/booking/[session_id]`, chat handoff.
