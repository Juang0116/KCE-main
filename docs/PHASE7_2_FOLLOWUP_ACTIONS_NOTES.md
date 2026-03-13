# Phase 7.2 — Follow-up comercial + acciones en deal detail

## Qué validar
- `/admin/deals/[id]` carga sin errores.
- El bloque “Siguiente mejor paso” cambia según `stage`.
- `Aplicar playbook` crea tareas y devuelve banner de éxito.
- `Generar propuesta` funciona cuando el deal tiene `tour_slug`.
- El timeline sigue exportando JSON y playback sigue operativo.

## Objetivo
Hacer que el detalle del deal ayude a mover el pipeline, no solo a leer historial.
