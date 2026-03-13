# ADV MAR MOBILE AUTH + WHATSAPP SPRINT 17

## Objetivo
Mejorar la experiencia mobile en el header/menu con foco en acceso a cuenta e integración visible de WhatsApp.

## Cambios
- `src/components/Header.tsx`
  - `HeaderAuthButton` ahora recibe `locale` en desktop.
  - `MobileAuthActions` en header mobile usa modo `compact` para que siempre haya un acceso visible a login/cuenta.
  - Menú mobile ahora incluye CTA visible de WhatsApp dentro del bloque de soporte.
  - Si no hay `NEXT_PUBLIC_WHATSAPP_NUMBER`, el menú cae a `Contacto` en vez de quedarse sin acción.
- `src/features/auth/MobileAuthActions.tsx`
  - Nuevo prop `compact`.
  - En modo compacto muestra botón icon-only de login o cuenta para ahorrar espacio en mobile.
- `src/features/auth/AuthMenu.tsx`
  - Estado signed-out en mobile ahora renderiza una tarjeta clara de Cuenta con CTA principal `Iniciar sesión` y CTA secundaria `Crear cuenta`.

## Impacto esperado
- En celular ya debe haber una forma clara de iniciar sesión o abrir la cuenta.
- El menú mobile ya tiene un acceso explícito a WhatsApp o, si falta env, un fallback a Contacto.
- Mejor jerarquía visual en el drawer para usuarios nuevos y usuarios autenticados.
