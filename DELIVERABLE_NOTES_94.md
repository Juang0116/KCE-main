# Deliverable Notes 94

## Focus
- Contacto y chat abren continuidad comercial real en CRM.
- Sales admin muestra mejor lectura founder / response lanes.

## Main changes
- `/api/bot/create-ticket` ahora puede abrir deal + task (best effort) cuando el caso es comercial.
- `ContactForm` muestra ticket/deal/task cuando existen.
- `contact/page.tsx` pasa salesContext real al formulario.
- `ChatWidget` manda topic/contexto al handoff y muestra deal si se abrió.
- `admin/sales/page.tsx` suma founder lanes visibles.
