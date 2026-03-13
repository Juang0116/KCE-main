# Sprint 24 — Hotfix TourCardPremium rating

## Fix aplicado
- Se alineó `TourLike` con el uso real de `TourCardPremium`.
- Se añadió `rating?: number` a `src/features/tours/adapters.ts`.
- `toTourLike()` ahora normaliza `rating` desde el catálogo/DB.
- Se sincronizó `src/types/tours.ts` para evitar futuros drift de tipos.

## Motivo
El card premium empezó a usar `tour.rating`, pero el tipo `TourLike` exportado por `adapters.ts` no incluía esa propiedad.

## Resultado esperado
`npm run build` ya no debe fallar en `src/features/tours/components/TourCardPremium.tsx`.
