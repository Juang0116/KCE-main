# ADV MAR PREMIUM VISUAL SPRINT 28 — HOTFIX 30

## Fix aplicado
- `src/features/auth/MobileAccountRail.tsx`
  - corregido `supabaseBrowser()` posiblemente `null`
  - corregido `Link onClick={onNavigate}` para `exactOptionalPropertyTypes`
  - ahora se usa `navProps` condicional para no pasar `onClick: undefined`

## Motivo
El build fallaba en mobile account rail por incompatibilidad de `onClick` opcional con `LinkProps` y modo estricto.
