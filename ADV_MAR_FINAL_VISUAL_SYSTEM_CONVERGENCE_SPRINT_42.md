# ADV MAR — Final Visual System Convergence Sprint 42

## Foco
- convergencia visual final
- menos repetición entre módulos marketing
- header desktop más limpio
- home más clara y menos fragmentada
- tours más enfocado a shortlist + conversión
- detalle de tour un poco más compacto y limpio en mobile

## Cambios principales
- `src/components/Header.tsx`
  - menos blur pesado en scroll y desktop nav
- `src/app/(marketing)/page.tsx`
  - se removió `AIConciergeSpotlight` de home
  - se fusionaron `Por qué KCE` + `Cómo funciona` en una sola sección más fuerte
- `src/app/(marketing)/tours/page.tsx`
  - se removió `AIConciergeSpotlight` para reducir repetición
  - CTA secundaria de helper ahora apunta a `destinations`
  - ajuste de spacing del conversion strip
- `src/app/(marketing)/tours/[slug]/page.tsx`
  - más compacidad visual en mobile
  - microbloque de ruta rápida antes del booking
  - quick nav más contenida
- `src/features/tours/components/MobileStickyBookingCta.tsx`
  - posición y caja afinadas para mobile

## Objetivo
Que KCE se sienta menos como “muchas buenas piezas separadas” y más como una marca premium coherente y con mejor narrativa visual.
