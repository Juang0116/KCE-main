# Phase 118 — Go-live command phase

## Objetivo
Cerrar la lectura final de lanzamiento en rutas críticas sin abrir nuevas capas de producto.

## Qué se hizo
- Nuevo componente compartido `GoLiveCommandRail`.
- Integración en Home, Tours, Plan, Contacto, Checkout Success, Booking y Account Support.
- Refuerzo de la misma lectura comercial/operativa:
  - público corto y claro,
  - booking como centro post-compra,
  - soporte con contexto,
  - contacto premium como escalamiento controlado.
- `SupportCenter` ahora genera un enlace a contacto premium preservando `bookingId`, `ticket`, `conversation` y mensaje base cuando existan.

## Gate recomendado antes de producción
- `npm run build`
- QA manual de rutas críticas
- Validación del handoff soporte -> contacto premium con contexto preservado
- Validación mobile de booking / support / contact
