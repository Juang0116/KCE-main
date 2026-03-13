# KCE MAR Sprint 45 Hotfix 46

## Fix aplicado
Se corrigió el error de build en las landings de `discover` causado por pasar `waHref` (`string | null`) directamente al atributo `href` de un anchor.

## Cambio
En estas rutas:
- `src/app/(marketing)/discover/coffee/page.tsx`
- `src/app/(marketing)/discover/europe/page.tsx`
- `src/app/(marketing)/discover/cultural/page.tsx`

Se añadió:
- `const waOrContactHref = waHref ?? withLocale(locale, '/contact');`

Y los anchors de WhatsApp ahora usan `waOrContactHref`.

## Resultado
- si existe WhatsApp configurado, usa el link de WhatsApp
- si no existe, cae de forma segura a `/contact`
- el build deja de romper por `string | null` vs `string | undefined`
