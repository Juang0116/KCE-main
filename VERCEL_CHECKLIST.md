# ✅ Checklist Vercel — Paso a Paso

## Problema 1: La IA dice "test" o no responde
**Causa:** Falta `GEMINI_API_KEY` en Vercel.
**Fix:** Vercel → Project → Settings → Environment Variables → Add:
```
GEMINI_API_KEY        = (tu key de Google AI Studio)
GEMINI_MODEL          = gemini-2.0-flash
AI_PRIMARY            = gemini
```

## Problema 2: Tours dan página 404
**Causa:** La DB de Supabase no tiene tours (SQL patch no fue ejecutado).
**Fix:** Supabase → SQL Editor → pegar y ejecutar `supabase_patch_p93_tours_seed.sql`

## Variables mínimas para que todo funcione

Vercel → Settings → Environment Variables:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | tu URL de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tu anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | tu service role key |
| `GEMINI_API_KEY` | tu key de Google AI Studio |
| `GEMINI_MODEL` | `gemini-2.0-flash` |
| `AI_PRIMARY` | `gemini` |
| `RESEND_API_KEY` | tu key de Resend |
| `EMAIL_FROM` | `KCE <hello@kce.travel>` |
| `ADMIN_TOKEN` | una contraseña fuerte (ej: `kce-admin-2025`) |
| `OPS_NOTIFY_EMAIL_TO` | tu email personal |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `57XXXXXXXXXX` |
| `KCE_WHATSAPP_NUMBER` | `57XXXXXXXXXX` (mismo) |
| `CRON_SECRET` | igual que ADMIN_TOKEN o diferente |

## SQL patches a ejecutar en Supabase (orden)
1. `supabase_patch_p91_followup_sequences_seed.sql` — secuencia drip
2. `supabase_patch_p92_blog_first_post.sql` — blog posts
3. `supabase_patch_p93_tours_seed.sql` — ⚠️ CRÍTICO — sin esto los tours dan 404
4. `supabase_patch_p94_ops_views.sql` — vistas de ops
5. `supabase_patch_p96_security_fixes.sql` — ⚠️ CRÍTICO — arregla los 4 errores de Security Advisor

## Supabase Security Advisor → Auth Settings
Para arreglar "Leaked Password Protection Disabled":
Supabase → Authentication → Settings → Enable "Leaked password protection"

## Crons activos (plan gratis = solo 2)
```json
{
  "crons": [
    { "path": "/api/admin/sales/autopilot/cron", "schedule": "0 * * * *" },
    { "path": "/api/admin/sequences/cron", "schedule": "*/15 * * * *" }
  ]
}
```
- **autopilot** (cada hora): CRM + Ops Agent (recordatorios pre-tour) + Review Agent (pedidos de reseña)
- **sequences** (cada 15min): drip de seguimiento 24h/72h a leads

## Verificar que funciona
1. Ve a `kce.travel/admin/setup` → todo verde
2. Abre el chat → escribe "hola" → debe responder (no "test")
3. Ve a `/tours` → deben aparecer los 6 tours
4. `/admin/command-center` → debe cargar el CEO Brief de Gemini

---

## 🔍 Diagnóstico: ¿Por qué falla la IA?

Después de deployar, ve a esta URL en tu browser (tienes que estar logueado en /admin primero):

```
https://kce-main.vercel.app/api/admin/debug-ai
```

Te va a mostrar:
- Si la key está configurada (`geminiKeySet: true/false`)
- Cuántos caracteres tiene (`geminiKeyLength`)
- Los primeros 8 caracteres (`geminiKeyPrefix: "AIzaSy..."`)
- El resultado del test en vivo (`geminiTestOk: true/false`)
- Si falla, el error exacto de Gemini

**Causas comunes:**
- `geminiKeySet: false` → la variable no está en Vercel o tiene nombre diferente
- `geminiKeyLength: 40` con prefix `AIzaSy` pero `geminiTestOk: false` → la key está expirada o tiene restricciones de dominio en Google AI Studio
- `geminiTestError: fetch failed` → Vercel no puede alcanzar generativelanguage.googleapis.com (raro pero posible en algunas regiones)

**Para obtener una key nueva:**
1. Ve a https://aistudio.google.com
2. Clic en "Get API key" → "Create API key"
3. Copia la key (empieza con `AIzaSy...`)
4. En Vercel: Settings → Env Vars → borra la anterior → crea nueva con esa key
5. Redeploy

---

## 📧 Email de confirmación no llega — checklist

**Paso 1 — Verificar RESEND_API_KEY en Vercel:**
- Vercel → Settings → Environment Variables
- Debe existir: `RESEND_API_KEY` con valor `re_xxxx...`
- Obtener en: https://resend.com/api-keys

**Paso 2 — Verificar dominio en Resend:**
- Resend → Domains → Add Domain → `kce.travel`
- Agregar los DNS records que te da Resend en tu proveedor DNS
- El dominio debe aparecer como "Verified" antes de enviar

**Paso 3 — Verificar EMAIL_FROM:**
```
EMAIL_FROM=KCE <no-reply@kce.travel>
```
El dominio del FROM debe coincidir con el dominio verificado en Resend.

**Paso 4 — Test manual de email:**
En Resend → Logs puedes ver si los emails se están intentando enviar y si fallan.

**Paso 5 — ¿Está el canal pausado?**
En Supabase → SQL Editor ejecuta:
```sql
SELECT * FROM crm_channel_pauses;
-- Si hay filas con paused_until en el futuro, ejecuta:
DELETE FROM crm_channel_pauses WHERE channel = 'email';
```

**Paso 6 — Verificar que el webhook de Stripe está configurado:**
- Stripe Dashboard → Webhooks → tu endpoint → debe incluir `checkout.session.completed`
- El endpoint debe ser: `https://tu-dominio.vercel.app/api/webhooks/stripe`
