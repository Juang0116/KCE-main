# ADV MAR MOBILE MENU LOGIN ACCOUNT 18

## Objetivo
Hacer que el drawer mobile muestre de forma explícita el acceso a Login / Cuenta dentro del menú.

## Cambios
- `src/features/auth/MobileAuthActions.tsx`
  - nuevo prop `drawer?: boolean`
  - en drawer:
    - signed out => botones full width de **Iniciar sesión** y **Crear cuenta**
    - signed in => botones full width de **Cuenta** y **Cerrar sesión**
- `src/components/Header.tsx`
  - nuevo bloque **Cuenta > Acceso rápido** dentro del menú mobile
  - integra `MobileAuthActions` en modo `drawer`
  - mantiene `AuthMenu` y el resto del drawer

## Resultado esperado
- En el menú mobile ahora siempre debe verse una zona clara de acceso:
  - si no hay sesión: Login / Crear cuenta
  - si hay sesión: Cuenta / Cerrar sesión
