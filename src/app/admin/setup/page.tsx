// src/app/admin/setup/page.tsx
// First-time setup checklist for KCE admin. Shows production readiness status.
import 'server-only';
import type { Metadata } from 'next';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Setup KCE | Admin' };

function env(key: string) {
  return !!(process.env[key] || '').trim();
}

type Check = { label: string; ok: boolean; hint: string; critical?: boolean };

export default function AdminSetupPage() {
  const checks: Check[] = [
    // Critical
    { label: 'Supabase conectado', ok: env('NEXT_PUBLIC_SUPABASE_URL') && env('SUPABASE_SERVICE_ROLE_KEY'), hint: 'Agrega NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel env vars', critical: true },
    { label: 'Stripe configurado', ok: env('STRIPE_SECRET_KEY') && env('STRIPE_WEBHOOK_SECRET'), hint: 'Agrega STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET', critical: true },
    { label: 'Email (Resend)', ok: env('RESEND_API_KEY') && env('EMAIL_FROM'), hint: 'Agrega RESEND_API_KEY y EMAIL_FROM=KCE <hello@kce.travel>', critical: true },
    // AI
    { label: 'Gemini IA configurado', ok: env('GEMINI_API_KEY'), hint: 'Agrega GEMINI_API_KEY para el concierge y generador de itinerarios' },
    { label: 'OpenAI (fallback)', ok: env('OPENAI_API_KEY'), hint: 'Opcional pero recomendado como fallback de Gemini' },
    // Ops
    { label: 'WhatsApp número', ok: env('NEXT_PUBLIC_WHATSAPP_NUMBER'), hint: 'Agrega NEXT_PUBLIC_WHATSAPP_NUMBER=573001234567 y KCE_WHATSAPP_NUMBER' },
    { label: 'Notificaciones ops', ok: env('OPS_NOTIFY_EMAIL_TO') || env('OPS_ALERT_EMAIL_TO'), hint: 'Agrega OPS_NOTIFY_EMAIL_TO=tuEmail para recibir alertas de leads y reservas' },
    { label: 'Cron secret', ok: env('CRON_SECRET') || env('CRON_API_TOKEN'), hint: 'Agrega CRON_SECRET con un token fuerte (32+ chars aleatorios)' },
    // SEO
    { label: 'URL del sitio', ok: env('NEXT_PUBLIC_SITE_URL'), hint: 'Agrega NEXT_PUBLIC_SITE_URL=https://kce.travel' },
    { label: 'Cloudflare Turnstile', ok: env('NEXT_PUBLIC_TURNSTILE_SITE_KEY'), hint: 'Opcional: protege formularios contra bots' },
  ];

  const critical = checks.filter((c) => c.critical);
  const optional = checks.filter((c) => !c.critical);
  const criticalOk = critical.every((c) => c.ok);
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-[color:var(--color-text)]">Setup & Estado del sistema</h1>
          <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
            Configuración de variables de entorno y estado de producción.
          </p>
        </div>
        <div className={`rounded-full px-4 py-2 text-sm font-bold ${criticalOk ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          {score}% listo
        </div>
      </div>

      {/* Critical */}
      <div className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <h2 className="mb-4 font-heading text-lg text-[color:var(--color-text)]">
          {criticalOk ? '✅' : '⚠️'} Configuración crítica
        </h2>
        <div className="space-y-3">
          {critical.map((c) => (
            <div key={c.label} className={`flex items-start gap-3 rounded-2xl border p-4 ${c.ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
              <span className="mt-0.5 text-lg">{c.ok ? '✓' : '✗'}</span>
              <div>
                <div className={`text-sm font-semibold ${c.ok ? 'text-emerald-800' : 'text-red-800'}`}>{c.label}</div>
                {!c.ok && <div className="mt-0.5 text-xs text-red-600">{c.hint}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optional */}
      <div className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <h2 className="mb-4 font-heading text-lg text-[color:var(--color-text)]">Configuración recomendada</h2>
        <div className="space-y-3">
          {optional.map((c) => (
            <div key={c.label} className={`flex items-start gap-3 rounded-2xl border p-4 ${c.ok ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
              <span className="mt-0.5 text-lg">{c.ok ? '✓' : '○'}</span>
              <div>
                <div className={`text-sm font-semibold ${c.ok ? 'text-emerald-800' : 'text-amber-800'}`}>{c.label}</div>
                {!c.ok && <div className="mt-0.5 text-xs text-amber-700">{c.hint}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SQL patches */}
      <div className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <h2 className="mb-4 font-heading text-lg text-[color:var(--color-text)]">SQL patches para Supabase</h2>
        <p className="mb-4 text-sm text-[color:var(--color-text-muted)]">Ejecutar en orden en Supabase SQL Editor:</p>
        <div className="space-y-2">
          {[
            { patch: 'supabase_patch_p91_followup_sequences_seed.sql', desc: 'Secuencia drip kce.plan.no_response.v1' },
            { patch: 'supabase_patch_p92_blog_first_post.sql', desc: 'Blog posts iniciales (ES + EN)' },
            { patch: 'supabase_patch_p93_tours_seed.sql', desc: '6 tours core del catálogo' },
            { patch: 'supabase_patch_p94_ops_views.sql', desc: 'Vistas SQL para ops dashboard' },
            { patch: 'supabase_patch_p95_discover_seed.sql', desc: 'Posts adicionales para /discover' },
          ].map((p) => (
            <div key={p.patch} className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-3">
              <code className="text-xs font-mono text-brand-blue">{p.patch}</code>
              <div className="mt-0.5 text-xs text-[color:var(--color-text-muted)]">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="rounded-3xl border border-brand-blue/15 bg-brand-blue/5 p-6">
        <h2 className="mb-4 font-heading text-lg text-brand-blue">Verificar post-deploy</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ['/sitemap.xml', 'Sitemap (tours + blog)'],
            ['/api/health', 'Health check'],
            ['/admin/agents', 'Panel agentes IA'],
            ['/admin/command-center', 'CEO Brief'],
            ['/plan', 'Formulario de plan'],
            ['/tours', 'Catálogo de tours'],
          ].map(([href, label]) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer"
              className="rounded-xl border border-brand-blue/20 bg-[color:var(--color-surface)] px-3 py-2 text-sm text-brand-blue hover:bg-brand-blue/5 transition">
              {label} <span className="text-[color:var(--color-text-muted)]">→ {href}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
