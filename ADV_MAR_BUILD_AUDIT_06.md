# ADV MAR BUILD AUDIT 06

## Cambios incluidos
- Fix en `src/app/api/quiz/submit/route.ts`
- Se declaró el tipo local `TourRow` usado por el matcher del quiz
- Se mantuvo el tipo acotado al `select(...)` real de la ruta para evitar coupling con tipos más amplios del catálogo

## Motivo del error
La ruta referenciaba `TourRow[]` en varias funciones, pero el alias no estaba declarado ni importado.
TypeScript rompía en build con `Cannot find name 'TourRow'`.

## Decisión técnica
En vez de importar un tipo más grande como `DbTour` del catálogo, se dejó un tipo local mínimo con solo estas columnas:
- `id`
- `slug`
- `title`
- `city`
- `base_price`
- `rating`
- `tags`
- `is_featured`

Eso hace que la ruta sea más estable y evita falsos requerimientos de columnas que no se seleccionan en el query.
