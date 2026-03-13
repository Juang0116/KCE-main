# Sprint 48 — Final revenue + admin + account polish

## Objetivo
Cerrar mejor el loop entre revenue, bookings, account y soporte para que KCE se sienta más premium también después de la compra.

## Cambios principales
- Nuevo `RevenuePolishDeck` para unificar revenue, bookings, QA y account.
- `/admin/revenue` ahora arranca con una cabina comercial más conectada.
- `/admin/bookings` añade un puente explícito hacia revenue/account y un deck de pulido final.
- `AdminBookingsClient` incluye summary cards para paid/pending/session trace dentro del corte actual.
- Nuevo `AccountServiceRail` en `/account/bookings` para reforzar continuidad post-compra.
- `BookingsView` gana mejor framing post-purchase y acceso directo al booking center.

## Impacto esperado
- Mejor continuidad operativa entre cobro, entrega y soporte.
- Mejor percepción premium en la cuenta del viajero.
- Menos fricción para revisar reservas reales y saltar a recovery/QA cuando algo no cuadra.

## Siguiente sprint sugerido
- Sprint 49 — international content/growth machine
