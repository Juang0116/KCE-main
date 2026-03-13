# ADV_MAR_FINAL_SUPPORT_CUSTOMER_PIPELINE_SIMPLIFICATION_69

Sprint de cierre fuerte sobre la otra mitad de la cabina interna:
- `/admin/tickets`
- `/admin/conversations`
- `/admin/customers`
- `/admin/deals`

## Objetivo
Unificar toda la operación interna bajo el mismo lenguaje ejecutivo ya aplicado en:
- command center
- launch HQ
- revenue
- bookings
- marketing
- sales

## Qué se hizo
1. Simplificación de páginas
   - Cada una ahora abre con una lectura ejecutiva clara (`AdminExecutivePanel`)
   - Se añadieron bloques compactos de `ReleaseGradeDeck` y `GoLiveSimplificationDeck`
   - Se redujo la sensación de paneles desconectados o lectura fragmentada

2. Workbench operativo en clientes
   - Se añadió `AdminOperatorWorkbench` en:
     - `AdminTicketsClient`
     - `AdminConversationsClient`
     - `AdminCustomersClient`
     - `AdminDealsClient`
   - Cada vista ahora empieza con:
     - acciones rápidas
     - señales visibles
     - contexto de operación del día

3. Deals más limpio
   - Se eliminó la duplicación entre métricas y lectura operativa
   - El valor visible, pipeline ponderado y presión de checkout ahora viven arriba como señales de workbench

## Resultado buscado
Menos “deck sprawl”, menos lectura ornamental y más claridad para operar:
- qué mirar primero
- qué ruta abrir luego
- qué merece acción hoy
- qué puede esperar
