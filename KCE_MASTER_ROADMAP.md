# KCE — Roadmap maestro (producto completo)

Este documento define el **KCE completo** (no solo el MVP). Está organizado por fases con
entregables, dependencias y criterios de aceptación.

---

## 1) Estado actual (hoy)

### 1.1 Plataforma

- Next.js 15 (App Router) + TypeScript + Tailwind.
- i18n por prefijo (es/en/fr/de).
- Marketing: home, tours, tour detail, discover, blog/vlog, contact, policies, newsletter.

### 1.2 Comercio / reservas

- Stripe Checkout + webhook.
- Booking guardado en Supabase + página success/booking + factura PDF + email (Resend).

### 1.3 CRM / backoffice

- Admin (tickets, conversations, customers, leads, deals, metrics, segments, tasks, content,
  reviews, events).
- QA harness y runbook de release.

### 1.4 Auth / cuenta

- Email+Password, reset, verify email, callback.
- /account para ver sesión y gestionar seguridad.
- Wishlist protegida por sesión (y remove).

### 1.5 Observabilidad

- /api/health y /api/health/supabase.
- Events (UTM capture, view-tour) y locks/idempotencia.

---

## 2) Objetivo del producto completo

**KCE completo** = plataforma global de turismo con:

1. adquisición (marketing/SEO/ads),
2. conversión (tours, checkout, upsells),
3. operación (CRM, soporte, itinerarios),
4. fidelización (cuentas, reviews, referidos),
5. analítica (métricas, cohortes, atribución),
6. IA segura (asistente vendedor + soporte + analista).

---

## 3) Roadmap por fases

### P0 — Estabilidad y release (base dura)

**Objetivo:** deploy sin fricción + cero errores críticos.

- Build 100% verde (TS + ESLint + Next build).
- Variables de entorno unificadas y validadas.
- Hardening de endpoints: CORS, rate limit básico, idempotencia.
- Logs de errores (server) y fallback UX (client).

**Aceptación:** `npm run build` pasa local + Vercel; checkout end-to-end funciona; healthchecks
responden.

### P1 — Cuenta profesional (tipo Instagram/Facebook)

**Objetivo:** el usuario sienta “tengo cuenta real”.

- Estado de sesión visible (navbar + account card).
- Editar perfil (nombre, teléfono, avatar).
- Gestión de email: cambio con confirmación.
- Gestión de password: reset + cambio dentro de cuenta.
- Seguridad: “cerrar sesión en todos los dispositivos”.
- Notificaciones claras: verificación obligatoria, cooldowns, estados.

**Aceptación:** usuario entiende si está logueado; puede actualizar info; puede revocar sesiones.

### P2 — Seguridad y cumplimiento

- Políticas RLS consistentes (auth.uid(), ownership, admin roles).
- Storage: buckets (avatars, reviews-media) con políticas correctas.
- Auditoría de secretos: rotación y verificación `.gitignore`.
- CSP (módulo), headers, protección anti-abuso (bot/tickets).
- TOTP 2FA opcional (si aplica al modelo de negocio).

**Aceptación:** “zero trust”: anon key solo con RLS; admin key solo server; storage sin huecos.

### P3 — Producto turístico premium (catálogo y operación)

- Catálogo avanzado: filtros, disponibilidad, pricing por temporada.
- Extras/upsells: transporte, fotos, seguro, comida.
- Gestión de reservas: cambios/cancelaciones, reembolsos parciales.
- Gestión de inventario / cupos y calendarización.
- Contenido: blog/vlog con editor y SEO.

**Aceptación:** un operador puede administrar tours y reservas sin tocar código.

### P4 — Growth y marketing (captación seria)

- SEO técnico: sitemap, schema.org, OG images, performance.
- Landing por ciudad/tema, funnels y lead magnets.
- Newsletter segmentada (doble opt-in).
- UTM + atribución básica + panel de funnel.
- Integración redes y WhatsApp CTA con tracking.

**Aceptación:** podemos medir: visitas → lead → checkout → paid.

### P5 — CRM completo (ventas + soporte 24/7)

- Inbox unificado (web/email/whatsapp\*): conversaciones y tickets.
- SLA, asignación, tags, macros, plantillas.
- Customers 360: historial de compras, preferencias, notas.
- Deals pipeline: etapas, probabilidad, tasks automatizados.
- Segmentos dinámicos + campañas.

**Aceptación:** ventas y soporte trabajan en el admin sin herramientas externas.

### P6 — IA segura (agente vendedor/soporte/analista)

- Agent “Discovery”: preguntas + perfil del viajero.
- “Recommendations”: tours existentes + razones + comparador.
- “Booking”: crea lead/ticket, propone itinerario, genera checkout.
- “Support”: reset, verificación, estado de pago, reenvío invoice.
- “Analytics”: resume tickets, principales objeciones, cohortes.

**Aceptación:** IA no ejecuta acciones peligrosas sin validación; logs y permisos; responde
multidioma; mejora conversión.

---

## 4) Qué falta para “terminar” (definición realista)

No existe un “fin” único: el producto completo se alcanza cuando:

- P0–P2 están sólidos (seguridad/operación),
- P3–P5 permiten operar y crecer,
- P6 añade diferenciación (IA) sin riesgo.

Si hay que poner un hito de “KCE completo v1”: **P0–P5** cerrados + IA (P6) en modo asistente
controlado.

---

## 5) Próximo paso recomendado

1. Cerrar P0 (deploy limpio) + check de env.
2. P1 cuenta “pro” (sesión visible + seguridad global logout + avatar/phone estable).
3. P2 storage/RLS y hardening.
