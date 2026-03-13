# Sprint 36 — Tours mobile responsive cleanup

## Objetivo
Quitar fricción horizontal en el detalle de tours mobile y hacer la navegación rápida más fija/usable sin deslizar la pantalla lateralmente.

## Cambios
- `src/app/(marketing)/tours/[slug]/page.tsx`
  - `main` y columna principal con `overflow-x-clip` y `min-w-0`
  - hero más compacto en mobile
  - tarjeta de precio del hero con ancho controlado
  - quick nav cambia de carrusel horizontal a grid 2 columnas en mobile
- `src/features/tours/components/MobileStickyBookingCta.tsx`
  - sticky CTA más estrecho y mejor contenido dentro del viewport

## Resultado esperado
- En celular ya no debe hacer falta deslizar izquierda/derecha para ver la navegación rápida ni el contenido principal.
- El detalle del tour se siente más estable y más mobile-first.
