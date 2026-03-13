# KCE 3.0 — Next.js + TypeScript + Tailwind

Experiencias culturales en Colombia con checkout, reseñas y un asistente de viaje con IA.

## ⚡️ Stack

- **Next.js 15 (App Router)** — SSR/SSG, Edge & Node runtimes
- **TypeScript** — tipado estricto
- **TailwindCSS** — diseño rápido con tokens de marca
- **Stripe** — pagos (Checkout + Webhooks)
- **Supabase** — base de datos y API (SDK server/admin)
- **OpenAI** — planner de itinerarios y chat IA
- **SEO** — `next-seo`, sitemap y robots
- **Linting/Format** — ESLint + Prettier + TypeCheck
- **Accesibilidad** — webhint listo para usarse (opcional)

---

## 🚀 Arranque rápido

````bash
npm install
npm run dev
# http://localhost:3000

## Setup rápido (local)

1) Instala dependencias

```bash
npm install
````

2. Variables de entorno

- Copia `.env.example` a `.env.local`
- Rellena como mínimo:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL` (por defecto `http://localhost:3000`)

3. Supabase (SQL Editor)

En tu proyecto de Supabase:

- Abre **SQL Editor**
- Ejecuta `supabase_schema.sql` (idempotente)
- (Opcional) ejecuta `supabase_seed.sql` si quieres cargar tours demo

> Nota: El frontend funciona también en modo mock si aún no configuras Supabase, pero para ver tours
> reales y reservas necesitas la BD.

4. Levanta el proyecto

```bash
npm run dev
```

## Stripe (Checkout + Webhook)

- Configura en `.env.local`:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- El checkout usa `/api/checkout`
- El webhook está en `/api/webhooks/stripe` (runtime Node)

## QA E2E (Compra → Booking → PDF → ICS)

Guía rápida: `docs/QA_E2E.md`.

Verificación automática (local):

```bash
node scripts/verify_purchase.mjs \
  --success-url "http://localhost:3000/es/checkout/success?session_id=cs_test_..." \
  --token local-dev \
  --base http://localhost:3000
```

## Arquitectura de catálogo de tours

- **Modo Supabase**: si `NEXT_PUBLIC_SUPABASE_*` está configurado, el catálogo lee de la tabla
  `public.tours`.
- **Modo Mock**: si no hay env o falla la consulta, se usa el dataset local
  (`src/features/tours/data.mock.ts`).
