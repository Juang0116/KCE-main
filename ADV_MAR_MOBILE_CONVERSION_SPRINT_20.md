# ADV MAR – Mobile Conversion + Account Discoverability Sprint 20

## Objetivo
Subir el nivel mobile-first de KCE ahora que build y menú ya están estables.

## Cambios principales
- `src/features/auth/MobileAuthActions.tsx`
  - `compact` dejó de ser solo icono y ahora muestra chip con texto visible (`Iniciar sesión` / `Cuenta`).
- `src/components/Header.tsx`
  - drawer mobile con bloque `sticky` de acceso rápido arriba.
  - login, cuenta, crear cuenta y wishlist quedan visibles también en vertical.
- `src/features/marketing/MobileQuickActions.tsx`
  - nuevo rail mobile con accesos rápidos a Tours, Quiz, Login, WhatsApp/Contacto y Wishlist.
- `src/app/(marketing)/page.tsx`
  - rail mobile insertado justo después del hero.
- `src/app/(marketing)/tours/page.tsx`
  - rail mobile insertado al inicio del catálogo.
- `src/app/(marketing)/quiz/page.tsx`
  - rail mobile insertado antes del bloque principal del matcher.

## Impacto esperado
- menor fricción para usuarios mobile vertical.
- cuenta/login visibles sin depender del layout horizontal.
- acceso más rápido a rutas de conversión clave.
- mejor transición home -> quiz/tours/login/whatsapp.
