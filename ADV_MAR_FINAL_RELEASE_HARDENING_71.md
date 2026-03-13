# ADV MAR FINAL RELEASE HARDENING 71

Este sprint empuja el cierre final de KCE hacia una sensación más release-grade en la capa post-compra y QA:

## Alcance
- Simplificación premium de `/account` y `/account/bookings`
- Action workbenches nuevos para traveler flows
- Mejor claridad post-checkout en `/checkout/success`
- Mejor claridad post-purchase en `/booking/[session_id]`
- QA admin simplificado a lectura más ejecutiva
- Invoice account route ahora soporta apertura inline (`download=0`) además de descarga forzada

## Impacto
- Menos ruido visual en zonas críticas de continuidad
- Mejor comprensión de la siguiente acción correcta
- Mejor UX para abrir factura desde cuenta en navegador/móvil
- QA final más legible para decisión go/no-go

## Archivos clave
- `src/components/traveler/TravelerExecutivePanel.tsx`
- `src/components/traveler/TravelerActionWorkbench.tsx`
- `src/app/(marketing)/account/page.tsx`
- `src/app/(marketing)/account/bookings/page.tsx`
- `src/app/(marketing)/checkout/success/page.tsx`
- `src/app/booking/[session_id]/page.tsx`
- `src/app/api/account/invoice/[session_id]/route.ts`
- `src/features/bookings/BookingsView.tsx`
- `src/app/admin/qa/page.tsx`
