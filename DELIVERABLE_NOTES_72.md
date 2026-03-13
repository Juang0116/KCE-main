# KCE-main — Deliverable 72

Cambios incluidos en esta entrega:

## 1) Chat IA más profesional
- Nuevo renderer `src/components/ChatMarkdown.tsx`
- El chat público ahora renderiza Markdown (negrillas, listas, separadores, enlaces, bloques)
- El chat interno de Admin AI Lab también renderiza Markdown
- Burbujas más claras con etiqueta visual de rol (`KCE concierge`, `AI response`, etc.)

## 2) Respuestas más cortas y mejor estructuradas
- Ajuste del system prompt en `src/app/api/ai/route.ts`
- Máximo 3 preguntas por mensaje
- Formato Markdown simple
- Objetivo de 60–140 palabras por respuesta
- Una sola siguiente acción o pregunta final

## 3) Simplificación pública inicial
- Header simplificado: Tours / Destinations / Plan personalizado / About / Contact
- Footer simplificado: se removieron links más internos o prematuros del bloque principal
- `/quiz` renombrado visualmente a `Plan personalizado` en navegación y página
- Copy de la página `/quiz` más orientado a viajero real y menos a lenguaje interno/growth

## 4) Release polish
- `package.json` actualizado con repo/issues reales
- Se agregaron iconos faltantes:
  - `public/icons/icon-192.png`
  - `public/icons/icon-512.png`

## Pendiente para siguiente sprint
- Separar shell pública vs admin
- Ocultar o rehacer Discover
- Limpiar más copy interno en Home / Tours / Destinations
- Estructura de mensajes más avanzada por tipo (`summary`, `handoff`, `tour card`, etc.)
