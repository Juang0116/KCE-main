# KCE Pro Release Runbook (Operable 100%)

Este runbook está diseñado para llevar KCE a un estado **operable al 100%**:

- Un turista compra un tour (Stripe)
- El webhook registra la reserva (Supabase)
- Se envía email de confirmación con links seguros
- Se genera factura PDF (descarga + adjunto)
- Admin puede ver/exportar datos
- Seguridad: sin fugas de PII/llaves + rate limiting + links firmados

> Nota: el proyecto corre bien sin Supabase configurado (dev/demo). Cuando conectes Supabase, el
> rate limit y el funnel quedan “full”.

---

## 0) Requisitos

- Node.js (LTS recomendado)
- Git
- Cuenta en GitHub (repo privado ok)
- Cuenta en Vercel (gratis)
- Cuenta en Supabase (gratis)
- Cuenta en Stripe (modo test sirve)
- Cuenta en Resend (modo dev/onboarding sirve)

---

## 1) Setup local

```bash
npm i
npm run qa:full
npm run dev
```

### Checks rápidos

- `http://localhost:3000/api/health` debe responder 200
- `http://localhost:3000/es/tours` debe cargar

---

## 2) Variables de entorno

Crea `.env.local` (NO se sube a git). Puedes partir de `.env.example`.

### Mínimas (para operar con seguridad)

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_TOKEN=pon_una_clave_larga
LINK_TOKEN_SECRET=pon_otra_clave_larga_32+
```

### Supabase (cuando actives DB)

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Stripe

```env
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

### Email (Resend)

```env
RESEND_API_KEY=...
EMAIL_FROM="KCE <onboarding@resend.dev>"
```

---

## 3) Supabase (final step)

### 3.1 Crear proyecto y copiar llaves

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3.2 SQL mínimo (operable 100%)

Ejecuta en Supabase SQL editor:

```sql
create table if not exists public.event_locks (
  key text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text,
  city text,
  price_minor int not null default 0,
  currency text not null default 'eur',
  images jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique not null,
  tour_id uuid references public.tours(id),
  status text not null default 'paid',
  date date,
  persons int not null default 1,
  total int not null default 0,
  currency text not null default 'eur',
  origin_currency text,
  customer_email text,
  customer_name text,
  phone text,
  extras jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text,
  name text,
  phone text,
  source text,
  utm jsonb not null default '{}'::jsonb,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  request_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.tours enable row level security;
alter table public.bookings enable row level security;
alter table public.leads enable row level security;
alter table public.events enable row level security;

drop policy if exists "tours public read" on public.tours;
create policy "tours public read" on public.tours
for select using (is_active = true);
```

> Importante: bookings/leads/events quedan _deny-by-default_ para el público. Se gestionan vía API
> server con `SUPABASE_SERVICE_ROLE_KEY`.

---

## 4) Stripe webhook (local)

1. Instala Stripe CLI.
2. Login:

```bash
stripe login
```

3. Escucha y reenvía al webhook local:

```bash
stripe listen --forward-to http://127.0.0.1:3000/api/webhooks/stripe
```

Copia el `whsec_...` que muestra y ponlo como `STRIPE_WEBHOOK_SECRET`.

---

## 5) Funnel (camino dorado)

1. Entra a un tour y haz checkout en modo test.
2. Verifica:

- Webhook ok (Stripe CLI muestra 200)
- Booking creado (Supabase tabla `bookings`)
- Email enviado (Resend logs)
- Invoice PDF descarga `/api/invoice/:session_id?t=...`

---

## 6) Deploy gratis (Vercel)

1. Conecta GitHub → Import Project.
2. Build: `npm run build`
3. Install: `npm ci`
4. En Env Vars (Production y Preview) copia las mismas variables que en `.env.local`.
5. Actualiza:

```env
NEXT_PUBLIC_SITE_URL=https://TU-PROYECTO.vercel.app
```

6. En Stripe crea endpoint webhook:

- `https://TU-PROYECTO.vercel.app/api/webhooks/stripe`

Copia el secret y configúralo en Vercel.

---

## 7) “Release gates” (no se salta)

Antes de mergear a `main`:

```bash
npm run qa:full
```

Y en GitHub protege `main` exigiendo CI verde.
