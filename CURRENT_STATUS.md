# KCE — Estado de trabajo (para hoy)

## 1) Dónde vamos (resumen ejecutivo)

- KCE ya tiene una base seria de **producto + operación**: tours, checkout, bookings, CRM, admin, auth y continuidad post-compra.
- El trabajo más valioso ahora es **cerrar convergencia premium del frente público**:
  1. **Home / Tours / Destinations** con la misma promesa y jerarquía,
  2. **Plan + Chat + Contacto** como continuidad natural,
  3. **Discover / Social / Newsletter** claramente secundarios,
  4. **release hygiene** final antes de empujar crecimiento más agresivo.

## 2) Qué ya quedó mejor en esta ronda

- Home ahora empuja con más claridad el núcleo visible: **Tours, Destinations y Plan personalizado**.
- Tours quedó con copy más enfocada a **comparar mejor y reservar con menos ruido**.
- Destinations quedó más clara como **entrada por ciudad/región**, no como una página ambigua.
- La promesa visible del sitio está más cerca de una **marca premium, seria y más fácil de entender**.

## 3) Próximo objetivo (48-72h de enfoque)

- Cerrar la **production-readiness final phase**:
  - revisión fina de rutas críticas públicas (`/`, `/tours`, `/plan`, `/contact`),
  - revisión post-compra y soporte (`/checkout/success`, `/booking/[session_id]`, `/account`, `/account/bookings`, `/account/support`),
  - confirmar que público, booking, cuenta y soporte repiten la misma lectura final sin abrir frentes nuevos.

- Gate de calidad antes de salida real:
  - `npm run build` ok
  - flujo checkout → booking → cuenta → soporte → contacto coherente
  - support center con contexto importado y escalamiento a contacto premium funcionando
  - QA manual del núcleo: `/`, `/tours`, `/plan`, `/contact`, `/checkout/success`, `/booking/[session_id]`, `/account`, `/account/bookings`, `/account/support`, `/account/support/[id]`

## Phase 111 — Premium release convergence
- `/plan` ahora tiene metadata más sólida, badges de confianza y una convergencia premium más clara hacia tours, contacto y soporte humano.
- `/contact` fue reescrita como página de continuidad real: mejor hero, mejor triage de entrada, metadata más fuerte y mejor jerarquía para soporte, reservas y follow-up.
- El strip premium ya conecta explícitamente `/tours`, `/plan` y `/contact` como una sola ruta comercial.
- Limpieza adicional de naming visible en componentes marketing para reducir rastros de `quiz` en la superficie pública.

## Phase 112 — Release-grade polish de tours + detail + post-purchase
- Nuevo componente compartido `ReleaseConfidenceBand` para reforzar continuidad comercial y promesa de soporte en páginas críticas.
- `/tours` ahora cierra con una banda más clara de comparación → plan → contacto, alineada al catálogo premium.
- `/tours/[slug]` ahora empuja la promesa completa: detalle, checkout protegido y soporte humano con contexto, no solo la venta.
- `/checkout/success` y `/booking/[session_id]` refuerzan booking, invoice, calendario y soporte como un mismo sistema post-compra.
- El siguiente gate recomendado sigue siendo validar `npm run build` + QA manual del núcleo público y post-compra.

## Phase 113 — Public release hardening: trust, legal, assets
- Nuevo componente compartido `LaunchTrustRail` integrado en `/plan`, `/contact`, `/checkout/success` y `/booking/[session_id]` para mostrar privacidad, términos, cookies y soporte como parte visible del núcleo premium.
- Assets de lanzamiento reforzados: `apple-touch-icon.png`, `safari-pinned-tab.svg`, `public/.well-known/security.txt` y `public/humans.txt`.
- `layout.tsx` ahora declara apple touch icon y mask icon, reforzando higiene PWA/browser del release.
- Páginas legales reforzadas: `privacy` y `terms` con metadata social más consistente y navegación legal cruzada; `cookies` recibe head SEO/social dedicado.
- El siguiente gate recomendado sigue siendo validar `npm run build` + QA manual del núcleo público, assets (`/apple-touch-icon.png`, `/safari-pinned-tab.svg`, `/.well-known/security.txt`) y rutas legales.


## Phase 114 — Mobile release gate + core decision convergence
- Nuevo componente compartido `PublicCoreDecisionRail` para repetir la misma jerarquía pública en Home, Tours y detail: **Tours / Destinations / Plan personalizado**.
- Home y `/tours` ahora muestran `MobileQuickActions`, reforzando el soporte mobile sin abrir más ruido en la navegación.
- El sticky mobile de `/tours/[slug]` ya no fuerza solo “Reservar”: ahora también ofrece **Plan primero** y ayuda/contexto para recuperar al viajero indeciso.
- Nuevo documento `docs/RELEASE_GATE_PUBLIC_114.md` para validar esta capa antes de empujar más growth o editorial.
- El siguiente gate recomendado sigue siendo validar `npm run build` + QA manual mobile/desktop del núcleo: `/`, `/tours`, `/tours/[slug]`, `/plan`, `/contact`.

## Phase 115 — Launch-command phase: account, booking, support, CRM handoff
- Nuevo componente compartido `LaunchCommandContinuityRail` integrado en cuenta, reservas y soporte para repetir la misma lógica de continuidad: **cuenta / bookings / soporte / contacto**.
- `/account/support` ahora recibe y muestra contexto importado (bookingId, ticket, subject, message, source) antes de crear el ticket, reduciendo fricción para viajeros que llegan desde booking, chat o contacto.
- `TicketThread` fue reforzado como hilo operativo: mejor encabezado, atajos a reservas/contacto y explicación de continuidad para no abrir canales paralelos.
- `ChatWidget` ahora empuja mejor a soporte y bookings cuando ya existe handoff/ticket, y preserva `conversationId` + `ticket` en el enlace a contacto.
- `/contact` ahora reconoce `ticket` y `conversation` dentro del contexto entrante, alineando mejor CRM/handoff entre chat, soporte y continuidad humana.

## Phase 116 — Final launch polish: post-purchase, account, support, mobile continuity
- Nuevo componente compartido `LaunchCommandActionDeck` para repetir acciones rápidas de salida real en cuenta, reservas, soporte, ticket thread, checkout success y booking.
- `/account`, `/account/bookings`, `/account/support` y `/account/support/[id]` ahora muestran un command deck final con reentradas explícitas hacia reservas, soporte, contacto y catálogo.
- `/checkout/success` y `/booking/[session_id]` ahora repiten la misma lógica de continuidad con una banda adicional de booking / cuenta / soporte / más tours, especialmente útil en mobile.
- `SupportCenter` ahora importa también `conversation` en el contexto y ofrece plantillas rápidas para crear tickets más claros.
- `TicketThread` ahora trae plantillas cortas de respuesta para mantener el caso en un solo hilo y acelerar follow-up.
- Fase 117: release-candidate final del frente público y continuidad de ayuda. Nuevo componente compartido `ReleaseCandidateReadinessRail` integrado en Home, `/plan`, `/contact`, `/checkout/success`, `/booking/[session_id]` y `/account/support` para repetir la lectura correcta del sistema: núcleo público, continuidad post-compra y soporte con contexto. `SupportCenter` también refuerza la regla final de un solo hilo por caso y escalamiento con contexto.


## Phase 118 — Go-live command: rutas críticas, lectura pública y continuidad operativa
- Nuevo componente compartido `GoLiveCommandRail` integrado en Home, `/tours`, `/plan`, `/contact`, `/checkout/success`, `/booking/[session_id]` y `/account/support` para repetir la lectura final de lanzamiento: catálogo claro, plan, contacto, booking y soporte como un mismo sistema.
- `SupportCenter` ahora puede escalar a contacto premium arrastrando `bookingId`, `ticket`, `conversation` y mensaje base, reduciendo fricción al pasar de soporte a handoff humano.
- El frente público y la capa post-compra repiten una misma regla de go-live: siguiente paso visible, contexto preservado y menos ruido.
- El siguiente gate recomendado sigue siendo validar `npm run build` + QA manual de rutas críticas antes de salida real.


## Phase 119 — Production-readiness final: rutas críticas, cuenta, soporte y lectura final del sistema
- Nuevo componente compartido `ProductionReadinessFinalRail` integrado en Home, `/tours`, `/plan`, `/contact`, `/checkout/success`, `/booking/[session_id]`, `/account`, `/account/bookings` y `/account/support` para repetir la lectura final antes de salida real.
- Esta capa refuerza cuatro carriles estables según el punto: catálogo / plan / contacto en público, y booking / cuenta / soporte / contacto en post-compra.
- `SupportCenter` ahora habla explícitamente en clave de **production-readiness**, reforzando el uso de un solo hilo por caso y la conservación de bookingId / ticket / conversación.
- El siguiente gate recomendado sigue siendo validar `npm run build` + QA manual de rutas críticas y continuidad comercial/operativa antes de producción.

## Phase 120 — Consolidación real: limpieza de rails, upgrade AI prompt, SOPs operativos

### Qué se hizo
- **Limpieza completa de rails acumulados** en todas las rutas públicas y post-compra. Cada fase 111–119 había apilado un nuevo rail de "readiness" sin remover los anteriores. Se eliminaron 3-4 rails duplicados en 9 rutas distintas, conservando solo el rail con valor comercial real en cada contexto.
- **Upgrade del sistema de prompt del AI Concierge** (`buildSystemPrompt` en `src/app/api/ai/route.ts`): reorganizado por bloques semánticos, nuevo formato de tarjeta de tour estructurado, límites del agente explícitos, contrato de longitud más estricto.
- **SOPs operativos** documentados en `docs/KCE_SOPS_OPERATIVOS.md`: 8 SOPs listos para operación real (lead entrante, propuesta, booking, soporte, coordinación, reseña, prioridades del fundador, mantenimiento semanal).
- Corrección de import duplicado en `/contact/page.tsx`.

### Estado de rutas después de phase 120
| Ruta | Estado |
|------|--------|
| `/` | Limpia. Hero → PublicCoreDecisionRail → tours → reseñas → CTA |
| `/tours` | Limpia. Catálogo → ReleaseConfidenceBand → reseñas |
| `/plan` | Limpia. Formulario → LaunchTrustRail → PremiumConversionStrip |
| `/contact` | Limpia. Formulario → PremiumConversionStrip |
| `/checkout/success` | Limpia. Confirmación → LaunchCommandActionDeck → más tours |
| `/booking/[session_id]` | Limpia. Detalles → LaunchCommandActionDeck → LaunchTrustRail |
| `/account` | Limpia. Shell → LaunchCommandContinuityRail → LaunchCommandActionDeck |
| `/account/bookings` | Limpia. Lista → LaunchCommandContinuityRail → LaunchCommandActionDeck |
| `/account/support` | Limpia. Soporte → LaunchCommandContinuityRail → LaunchCommandActionDeck → SupportCenter |

### Siguiente gate recomendado (Phase 121)
1. `npm run build` sin errores TypeScript.
2. QA manual de las 9 rutas limpias.
3. Test del chat con el nuevo prompt de concierge.
4. Llenar tabla de contactos en `KCE_SOPS_OPERATIVOS.md` con datos reales.
5. Deploy a Vercel con revisión de variables de entorno.


## Phase 120 (continuación) — Cleanup final: manifest, footer, metadata, package.json

### Qué se hizo en esta ronda
- **`LaunchCommandContinuityRail` + `TravelerActionWorkbench` eliminados** de todas las rutas de cuenta donde aún quedaban: `/account`, `/account/bookings`, `/account/support`, `/account/support/[id]`.
- **Footer limpio**: sección "Editorial y canales" (links a `/discover`, `/blog`, `/vlog`, `/social`, `/newsletter`) reemplazada por sección "Explora más" con links exclusivamente a páginas en producción real: Destinations, Wishlist, FAQ, Trust & safety, About.
- **Blog y Vlog con noindex**: añadido `robots: { index: false, follow: true }` en ambas páginas para evitar indexar contenido vacío.
- **`site.webmanifest` creado**: faltaba el archivo referenciado en `layout.tsx`. Ahora existe con colores de marca correctos (`background_color: #fff5e1`, `theme_color: #0D5BA1`) e íconos PWA.
- **`package.json` corregido**: `license: MIT → UNLICENSED` (proyecto comercial privado); eliminados `repository` y `bugs` públicos de GitHub.
- **Cero imports huérfanos** confirmado con scan completo de `src/app/`.

### Estado rutas después de esta ronda
| Ruta | Estado |
|------|--------|
| `/account` | Shell → LaunchCommandActionDeck → AccountView |
| `/account/bookings` | BookingTrustStrip → AccountServiceRail → LaunchCommandActionDeck → BookingsView |
| `/account/support` | Header → LaunchCommandActionDeck → SupportCenter |
| `/account/support/[id]` | LaunchCommandActionDeck → TicketThread |

### Siguiente gate (Phase 121)
1. `npm run build` limpio en Vercel — esto certifica todos los cambios.
2. `scripts/qa-gate.mjs` + `scripts/smoke.mjs` contra producción.
3. QA manual de las 9 rutas críticas.
4. Verificar PWA: `site.webmanifest` + íconos en Chrome DevTools → Application.
5. Una vez blog/vlog tengan contenido publicado, remover el noindex.

## Phase 121 — AI Agents: Gemini primary, itinerary-builder conectado, plan display rico

### Qué se hizo
- **Gemini 2.0 Flash como modelo principal** en los tres puntos de IA: chat concierge (`/api/ai`), quiz/plan (`/api/quiz/submit`) e itinerary-builder (`/api/itinerary-builder`). OpenAI es fallback en todos.
- **`quiz/submit`** reemplazó la función OpenAI-hardcoded por generación Gemini-primary con fallback, usando `AI_PRIMARY` / `AI_SECONDARY` del entorno.
- **`itinerary-builder`** ahora importa `listTours` y carga el catálogo real de Supabase (fallback a mock si falla). Prompt completo con schema JSON explícito — elimina el placeholder `(…tu esquema…)`.
- **`QuizForm`** hace dos llamadas paralelas (`Promise.allSettled`): quiz/submit para CRM + itinerary-builder para el plan rico. Display en 3 capas: rich plan Gemini (bloques hora+barrio+COP+seguridad) → itinerary simple fallback → tour cards.
- **System prompt del concierge** expandido: nueva sección `CAPACIDADES`, formato `## Plan día a día` con bloques de actividad, ahora puede armar itinerarios directamente en el chat.
- **`AssistantMessageBlocks`** reconoce y renderiza la nueva sección `## Plan día a día` con tarjeta azul brand.
- **`ChatWidget`** quick prompts actualizados: "Arma un plan de 3 días en Cartagena".
- **`placeholder.svg`** creado en `public/images/tours/` con gradiente KCE. Referencias actualizadas.
- **`.env.example`**: `GEMINI_MODEL=gemini-2.0-flash`.

### Estado rutas AI después de phase 121
| Superficie | Modelo principal | Fallback | Output |
|-----------|-----------------|---------|--------|
| Chat concierge `/api/ai` | Gemini 2.0 Flash | OpenAI | Markdown estructurado + itinerario día a día |
| Quiz/plan `/api/quiz/submit` | Gemini 2.0 Flash | OpenAI | JSON simple (morning/afternoon/evening) |
| Itinerary builder `/api/itinerary-builder` | Gemini 2.0 Flash | OpenAI | JSON rico (bloques+COP+safety+marketing) |

### Siguiente gate (Phase 122)
1. `npm run build` sin errores TypeScript — certifica todos los cambios.
2. Test `/plan` end-to-end con `GEMINI_API_KEY` real en Vercel.
3. Test chat: "Arma un plan de 3 días en Cartagena" → verificar sección `## Plan día a día`.
4. QA manual de 9 rutas críticas.
5. Scripts: `qa-gate.mjs` + `smoke.mjs` contra producción.

## Phase 122 — Agente de seguimiento automático activado

### Qué se hizo
- **`followupAgent.server.ts`** — nuevo agente central. `enrollLeadInFollowupSequence()` enrolla el lead en drip de 3 pasos (2h → 24h → 72h) y auto-siembra la secuencia en DB si no existe. `cancelFollowupOnBooking()` cancela enrollments activos cuando el lead paga.
- **`quiz/submit`** — llama `enrollLeadInFollowupSequence()` en fire-and-forget después de crear el deal. No bloquea la respuesta.
- **`stripe/webhook`** — `checkout.session.completed` llama `cancelFollowupOnBooking()` con `deal_id` / `lead_id` del metadata de Stripe. Lead que paga sale de la secuencia.
- **`vercel.json`** — 5 crons programados: sequences (15 min), outbound (10 min), autopilot (1h), alerts (8am), digest (lunes 9am).
- **`sequences/cron`** — acepta header `x-vercel-cron: 1` (Vercel nativo) + Bearer token. Body vacío ya no falla.
- **`sequences/enrollments`** — nuevo endpoint `GET` que lista la cola activa con step, ciudad, próxima ejecución y errores.
- **`sequences/route`** — listado de secuencias incluye `enrollments: { active, completed, failed }`.
- **`AdminSequencesClient`** — panel "Cola activa" con botón "Ver cola" que carga enrollments en tiempo real.
- **`supabase_patch_p91_followup_sequences_seed.sql`** — SQL idempotente para sembrar la secuencia directamente en Supabase.

### Estado del agente de seguimiento
```
Trigger:  quiz.crm_routed → enrollLeadInFollowupSequence()
Paso 0:   +2h  → email "Tu plan de viaje KCE está listo 🗺️"
Paso 1:   +24h → email "Tu itinerario sigue disponible ✈️"
Paso 2:   +72h → email "¿Seguimos con tu plan? 🌿"
Cancelar: checkout.session.completed → cancelFollowupOnBooking()
```

### Siguiente gate (Phase 123)
1. `npm run build` limpio.
2. Ejecutar `supabase_patch_p91_followup_sequences_seed.sql`.
3. Verificar secuencia en `/admin/sequences`.
4. Test end-to-end: formulario → enrollment → cron → email.
5. Conectar `deal_id` al metadata de Stripe checkout (para que el cancel funcione con datos reales).

## Phase 123 — Cierre del loop comercial: deal_id en Stripe, variables en emails, email post-itinerario

### Qué se hizo
- **`checkout/route.ts`** — auto-crea deal en CRM cuando hay email y no llega `dealId`. Pone `deal_id` + `lead_id` en el metadata de Stripe. El cancel de follow-ups ahora funciona en TODOS los flujos de booking, no solo los que venían del quiz.
- **`sequences.server.ts`** — `runSequenceCron` ahora resuelve variables reales antes de enviar: `{name}` (del cliente o lead), `{city}` (del enrollment metadata), `{budget}`, `{tours_url}`, `{contact_url}`. Importa `renderTemplateText` de `templates.server.ts`.
- **`marketingEmail.ts`** — `sendPlanResultsEmail` extendida: si llega `richPlan`, envía el email rico con itinerario día a día (bloques hora+barrio+costo, seguridad, total COP, CTA de asesor). Sin `richPlan`, usa el email de tours de siempre.
- **`/api/plan/email/route.ts`** — nuevo endpoint que recibe `{to, richPlan, marketingCopy, recommendations}` y dispara el email rico. Rate-limited a 5/hora/IP.
- **`QuizForm.tsx`** — después de recibir el `richPlan` del itinerary-builder, llama `/api/plan/email` en fire-and-forget si el usuario dio email + consentimiento.

### Flujo completo después de Phase 123
```
Usuario llena /plan + da email + consent
  ↓ quiz/submit → lead + deal en CRM → enrollLeadInFollowupSequence()
  ↓ itinerary-builder → richPlan (Gemini)
  ↓ QuizForm → /api/plan/email → email rico con itinerario (Resend)

Cron cada 15 min → sequences/cron
  ↓ renderTemplateText({name, city, ...}) → email drip con datos reales del lead

Pago Stripe → cancelFollowupOnBooking() → secuencia cancelada
Checkout sin dealId → auto-crea deal → deal_id en metadata Stripe
```

### Siguiente gate (Phase 124)
1. `npm run build` limpio.
2. Test E2E: form → email rico → ver email en bandeja.
3. Verificar que drip emails tienen {name} y {city} reales.
4. Gemini function calling en el chat (siguiente gran feature).
