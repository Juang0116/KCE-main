# KCE — Vercel Deploy Guide

## Variables de entorno requeridas

Agrega estas en Vercel → Project Settings → Environment Variables.

### Esenciales (sin estas el build falla)
```
NEXT_PUBLIC_SITE_URL=https://kce.travel
NEXT_PUBLIC_SUPABASE_URL=<tu-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### IA (al menos GEMINI_API_KEY)
```
AI_PRIMARY=gemini
AI_SECONDARY=openai
GEMINI_API_KEY=<tu-gemini-key>
GEMINI_MODEL=gemini-2.0-flash
OPENAI_API_KEY=<tu-openai-key>      # fallback, opcional
OPENAI_MODEL=gpt-4o-mini
```

### Email (Resend)
```
RESEND_API_KEY=<tu-resend-key>
EMAIL_FROM=KCE <hello@kce.travel>
EMAIL_REPLY_TO=hello@kce.travel
```

### WhatsApp
```
NEXT_PUBLIC_WHATSAPP_NUMBER=57XXXXXXXXXX   # número sin + ni espacios
KCE_WHATSAPP_NUMBER=57XXXXXXXXXX           # mismo número, para drip server-side
NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE=Hola KCE, quiero información sobre un tour.
```

### Admin
```
ADMIN_BASIC_USER=admin
ADMIN_BASIC_PASS=<contraseña-fuerte>
CRON_SECRET=<token-fuerte-para-crons>      # mínimo 32 chars aleatorios
```

### Seguridad (opcionales pero recomendados)
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<cloudflare-turnstile>
TURNSTILE_SECRET_KEY=<cloudflare-turnstile-secret>
INTERNAL_HMAC_SECRET=<token-64-chars>
```

---

## Pasos de deploy

### 1. Supabase — ejecutar SQL patches en orden
```
supabase_patch_p75_sequences.sql
supabase_patch_p91_followup_sequences_seed.sql
supabase_patch_p92_blog_first_post.sql
```
(Los otros patches más antiguos ya deberían estar aplicados.)

### 2. Vercel — conectar repo
```
vercel link
vercel env pull   # si quieres trabajar localmente con las vars de prod
```

### 3. Verificar crons después del deploy
En Vercel → Project → Settings → Crons deberías ver 5 jobs:

| Endpoint | Schedule |
|----------|----------|
| `/api/admin/sequences/cron` | Cada 15 min |
| `/api/admin/outbound/cron` | Cada 10 min |
| `/api/admin/sales/autopilot/cron` | Cada hora |
| `/api/admin/metrics/alerts/cron` | 8am diario |
| `/api/admin/ops/digest/cron` | Lunes 9am |

### 4. Stripe webhook
En Stripe Dashboard → Webhooks → Add endpoint:
```
URL: https://kce.travel/api/webhooks/stripe
Events: checkout.session.completed, checkout.session.async_payment_succeeded
```
Copia el webhook secret y pégalo como `STRIPE_WEBHOOK_SECRET`.

### 5. Test post-deploy
```bash
# Sitemap
curl https://kce.travel/sitemap.xml

# Health check
curl https://kce.travel/api/health

# Cron manual (con tu CRON_SECRET)
curl -X POST https://kce.travel/api/admin/sequences/cron \
  -H "x-vercel-cron: 1"
```

### 6. Test agentes manualmente
1. Ve a `/admin/agents`
2. Pulsa "▶ Ops Agent" → verifica que aparece en el log
3. Pulsa "▶ Review Agent" → verifica log
4. Revisa `/admin/outbound` → los mensajes deben estar en cola

### 7. Test itinerary tool en el chat
Escribe en el chat: `"arma un plan de 3 días en Bogotá para 2 personas"`
Debería aparecer la tarjeta azul `## Tu Plan de Viaje` con bloques horarios.

---

## Dominio
Configura `kce.travel` en Vercel → Project → Domains.
Asegúrate de que `NEXT_PUBLIC_SITE_URL=https://kce.travel` esté puesto.
