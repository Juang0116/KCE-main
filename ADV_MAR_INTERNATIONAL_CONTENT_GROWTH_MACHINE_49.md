# ADV MAR — International Content / Growth Machine 49

## Objetivo
Empujar KCE hacia una capa más seria de captación internacional con páginas por intención/mercado y un sistema más claro de acquisition → nurture → conversion.

## Cambios principales
- Nuevo componente `src/features/marketing/InternationalContentMachine.tsx`
- `src/app/(marketing)/discover/page.tsx`
  - quick actions reforzadas
  - nuevo bloque de content machine
  - grid de landings por intención/mercado integrado arriba del fold comercial
- `src/features/marketing/IntentMarketLandingGrid.tsx`
  - expansión de 4 a 7 rutas
  - nuevas rutas: luxury, family, adventure
- Nuevas landing pages:
  - `src/app/(marketing)/discover/luxury/page.tsx`
  - `src/app/(marketing)/discover/family/page.tsx`
  - `src/app/(marketing)/discover/adventure/page.tsx`

## Resultado esperado
- Discover deja de ser solo hub editorial y se acerca más a una máquina de growth
- KCE ya no depende tanto de una sola puerta de entrada genérica
- mejor estructura para captar tráfico internacional por intención y moverlo a quiz, tours, newsletter, lead magnet o handoff humano

## Nota
No se validó `npm run build` dentro de este entorno porque la copia usada no trae `node_modules`.
