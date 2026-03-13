# Sprint 39 — Admin Commercial Cockpit

## Objetivo
Conectar mejor la capa comercial/operativa de KCE para que Admin no se sienta como páginas separadas, sino como una cabina coherente:
- captura
- calificación
- cierre
- entrega
- revalidación

## Cambios incluidos
- Nuevo componente compartido `src/components/admin/CommercialControlDeck.tsx`
- Revisión visual/operativa de:
  - `src/app/admin/leads/page.tsx`
  - `src/app/admin/deals/page.tsx`
  - `src/app/admin/sales/page.tsx`
  - `src/app/admin/bookings/page.tsx`
  - `src/app/admin/tasks/page.tsx`
- Mejora grande de `src/app/admin/sales/AdminSalesCockpitClient.tsx` con:
  - `Commercial command board`
  - `Stage health`
  - lectura diaria de buckets:
    - cerrar hoy
    - rescatar ahora
    - calificar siguiente
  - valor visible del pipeline filtrado

## Impacto esperado
- Menos sensación de paneles aislados.
- Mejor lectura diaria para operar ventas y revenue.
- Mejor continuidad entre leads → deals → bookings → tasks → QA / revenue.
