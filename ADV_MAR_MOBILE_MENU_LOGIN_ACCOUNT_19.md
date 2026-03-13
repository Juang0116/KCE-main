# Sprint 19 — Mobile menu login/account hard fix

## Objetivo
Hacer que el menú mobile vertical muestre siempre accesos visibles a login/cuenta, sin depender de la detección de sesión o de un render secundario.

## Cambios
- `src/components/Header.tsx`
  - nuevo bloque superior fijo en el drawer con:
    - Iniciar sesión
    - Cuenta
    - Crear cuenta
  - rutas localizadas con `?next=` para login/register
  - cierre del drawer al navegar

## Resultado esperado
En mobile vertical, al abrir el menú, el usuario debe ver inmediatamente los CTAs de cuenta sin necesidad de orientación horizontal ni depender de un bloque inferior.
