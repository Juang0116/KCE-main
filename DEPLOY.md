# KCE — Guía de Deploy Completo

## 1. Variables de Entorno (Vercel / .env.local)

Copia `.env.example` como `.env.local` y rellena:

```env
# Site
NEXT_PUBLIC_SITE_URL=https://tudominio.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Admin
ADMIN_BASIC_USER=admin
ADMIN_BASIC_PASS=tu_password_seguro_aqui
ADMIN_TOKEN=un_token_largo_aleatorio

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=573001234567

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@tudominio.com

# OpenAI / Gemini (IA)
OPENAI_API_KEY=sk-...
GOOGLE_GENERATIVE_AI_API_KEY=AIza...

# Cloudflare Turnstile (anti-bot)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x...
TURNSTILE_SECRET_KEY=0x...
```

## 2. Supabase — Base de Datos

Ejecuta los SQL en este orden en el SQL Editor de Supabase:

1. `supabase_schema.sql` — Esquema base (solo primera vez)
2. `supabase_seed.sql` — Datos iniciales
3. `supabase_seed_kce_official_tours.sql` — Tours reales de KCE
4. `supabase_patch_p93_tours_seed.sql` — Seeds adicionales de tours
5. `supabase_patch_p94_ops_views.sql` — Vistas de operaciones
6. `supabase_migrations_fase3_fase4.sql` — Funcionalidades avanzadas

**Storage buckets en Supabase:**

- Crea bucket `identity_vault` (privado)
- Crea bucket `covers` (público, para imágenes de blog/tours)

## 3. Instalación y Build

```bash
npm install          # Instala react-day-picker, date-fns y todo
npm run build        # Debe pasar sin errores TypeScript
npm start            # Prueba local de producción
```

## 4. Deploy en Vercel

```bash
vercel --prod
```

O conecta el repositorio en vercel.com y configura las env vars.

**Webhook de Stripe:**

- En el dashboard de Stripe, crea webhook apuntando a: `https://tudominio.com/api/webhooks/stripe`
- Eventos a escuchar: `checkout.session.completed`, `payment_intent.succeeded`

## 5. Admin Panel

Accede a `/admin` con las credenciales que pusiste en `ADMIN_BASIC_USER/PASS`.

### Rutas principales del admin:

| Ruta                    | Función                               |
| ----------------------- | ------------------------------------- |
| `/admin`                | Dashboard principal                   |
| `/admin/tours`          | ✅ Catálogo de tours (listo)          |
| `/admin/tours/new`      | ✅ Crear nuevo tour                   |
| `/admin/bookings`       | ✅ Reservas + aprobación de identidad |
| `/admin/reviews`        | ✅ Moderación de reseñas              |
| `/admin/customers`      | ✅ CRM + verificación KYC             |
| `/admin/sales`          | Cockpit de ventas                     |
| `/admin/content/posts`  | ✅ Blog (crear, editar, publicar)     |
| `/admin/content/videos` | ✅ Vlogs (YouTube embeds)             |

## 6. Flujo de Venta Completo

1. Cliente visita `/tours/[slug]`
2. Selecciona fechas en BookingWidget → clicks "Ir al pago seguro"
3. Si no verificó identidad → sube ID/Pasaporte (IdentityUpload)
4. Al aprobar → Stripe Checkout se abre
5. Pago exitoso → webhook `/api/webhooks/stripe` guarda booking
6. En `/admin/bookings` → admin ve la reserva y puede verificar el ID

## 7. Fixes Aplicados en Esta Versión

- ✅ `BookingWidget V2` — Calendario modal con rango de fechas
- ✅ `react-day-picker` + `date-fns` añadidos a package.json
- ✅ `IdentityUpload` — prop `onUploadSuccess` funcional
- ✅ `/api/admin/customers/[id]/verify` — Next.js 15 compatible
- ✅ `/api/admin/customers/[id]/document` — URL firmada con signed URL
- ✅ `/api/admin/bookings/[id]/status` — Actualización de estado correcta
- ✅ `/api/admin/catalog` — CRUD de tours desde el admin
- ✅ Admin Tours page — Vista completa con búsqueda y filtros
- ✅ Reviews API — `total` accesible directamente en la respuesta
- ✅ `global.d.ts` — Declaración CSS para react-day-picker
- ✅ Auth confirm route — runtime declarado
