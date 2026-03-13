// src/lib/env.ts
import { z } from 'zod';

/**
 * Env loader (single source of truth)
 *
 * Rules:
 * - Prefer canonical names; legacy aliases are still supported.
 * - NEXT_PUBLIC_* is exposed to the browser (NEVER place secrets there).
 * - Server secrets are used only by Route Handlers / server-only code.
 * - Empty strings in .env.local are treated as undefined.
 */

const emptyToUndefined = (v: unknown) => {
  if (typeof v !== 'string') return v;
  const t = v.trim();
  return t === '' ? undefined : t;
};

function envString<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(emptyToUndefined, schema.optional());
}

function applyAliases(env: Record<string, string | undefined>, aliases: Record<string, string[]>) {
  const out = { ...env };
  for (const [canonical, alts] of Object.entries(aliases)) {
    const cur = String(out[canonical] ?? '').trim();
    if (cur) continue;
    for (const alt of alts) {
      const v = String(out[alt] ?? '').trim();
      if (v) {
        out[canonical] = v;
        break;
      }
    }
  }
  return out;
}

// Canonical -> legacy aliases supported (read-only compatibility).
const ALIASES: Record<string, string[]> = {
  // Site
  NEXT_PUBLIC_SITE_URL: ['SITE_URL', 'BASE_URL'],

  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: ['SUPABASE_SERVICE_ROLE'],
  NEXT_PUBLIC_SUPABASE_URL: ['SUPABASE_URL'],

  // Email
  EMAIL_FROM: ['RESEND_FROM'],
  RESEND_INBOUND_TOKEN: ['INBOUND_WEBHOOK_TOKEN'],

  // Cron
  CRON_SECRET: ['CRON_API_TOKEN'],

  // Ops notify legacy
  OPS_SLACK_WEBHOOK_URL: ['OPS_ALERT_WEBHOOK_URL'],
  OPS_NOTIFY_EMAIL_TO: ['OPS_ALERT_EMAIL_TO'],

  // Social legacy
  NEXT_PUBLIC_SOCIAL_FACEBOOK_URL: ['NEXT_PUBLIC_SOCIAL_FACEBOOK'],
  NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL: ['NEXT_PUBLIC_SOCIAL_INSTAGRAM'],
  NEXT_PUBLIC_SOCIAL_YOUTUBE_URL: ['NEXT_PUBLIC_SOCIAL_YOUTUBE'],
};

const raw = applyAliases(process.env as Record<string, string | undefined>, ALIASES);

/** Variables server-only */
const ServerSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  VERCEL_ENV: envString(z.enum(['production', 'preview', 'development'])),
  VERCEL_URL: envString(z.string()), // without protocol

  // Supabase (server/admin)
  SUPABASE_SERVICE_ROLE_KEY: envString(z.string().min(1)),

  // Stripe (server)
  STRIPE_SECRET_KEY: envString(z.string().min(1)),
  STRIPE_WEBHOOK_SECRET: envString(z.string().min(1)),
  STRIPE_MOCK: envString(z.string()),

  // Resend (server)
  RESEND_API_KEY: envString(z.string().min(1)),
  EMAIL_FROM: envString(z.string().min(1)),
  EMAIL_REPLY_TO: envString(z.string()),
  RESEND_INBOUND_TOKEN: envString(z.string().min(16)),

  // Admin basic auth (middleware)
  ADMIN_BASIC_USER: envString(z.string().min(1)),
  ADMIN_BASIC_PASS: envString(z.string().min(1)),

  // Admin panel login (cookie)
  ADMIN_USER: envString(z.string().min(1)),
  ADMIN_PASS: envString(z.string().min(1)),
  ADMIN_TOKEN: envString(z.string().min(16)),

  // RBAC bootstrap/enforcement
  RBAC_REQUIRED: envString(z.string()),
  RBAC_BOOTSTRAP_SECRET: envString(z.string().min(16)),

  // Signed actions (anti-CSRF/anti-replay)
  SIGNED_ACTIONS_SECRET: envString(z.string().min(16)),
  SIGNED_ACTIONS_MODE: envString(z.enum(['off', 'soft', 'required'])),
  SIGNED_ACTIONS_TTL_SECONDS: envString(z.string()),

  // Ops approvals (two-man rule)
  OPS_TWO_MAN_RULE: envString(z.string()),
  OPS_APPROVER_TOKEN: envString(z.string().min(16)),
  OPS_APPROVAL_TTL_MINUTES: envString(z.string()),

  // Link security
  LINK_TOKEN_SECRET: envString(z.string().min(16)),

  // Internal calls
  INTERNAL_API_KEY: envString(z.string().min(16)),
  INTERNAL_HMAC_SECRET: envString(z.string().min(16)),
  INTERNAL_HMAC_REQUIRED: envString(z.string()),

  // CORS allowlist
  CORS_ALLOW_ORIGINS: envString(z.string()),

  // Cloudflare Turnstile (optional)
  TURNSTILE_SECRET_KEY: envString(z.string().min(1)),
  TURNSTILE_ENFORCE: envString(z.string()),

  // Cron / jobs
  CRON_SECRET: envString(z.string().min(16)),
  AUTOPILOT_API_TOKEN: envString(z.string().min(16)),

  // CRM tuning (optional)
  CRM_FOLLOWUP_NOREPLY_24H: envString(z.string()),
  CRM_FOLLOWUP_NOREPLY_48H: envString(z.string()),
  CRM_AUTO_PROMOTE_WEIGHTS: envString(z.string()),
  CRM_WINNER_WEIGHT: envString(z.string()),
  CRM_LOSER_WEIGHT: envString(z.string()),
  CRM_CHECKOUT_UNPAID_AFTER_HOURS: envString(z.string()),
  CRM_WAITING_CUSTOMER_AFTER_HOURS: envString(z.string()),
  CRM_FOLLOWUP_MAX_WINDOW_DAYS: envString(z.string()),
  CRM_OUTBOUND_MIN_INTERVAL_HOURS: envString(z.string()),
  CRM_OUTBOUND_MAX_PER_7D: envString(z.string()),
  CRM_INCENTIVES_ENABLED: envString(z.string()),
  CRM_INCENTIVES_MAX_PER_DAY: envString(z.string()),
  CRM_INCENTIVE_EXPIRES_HOURS: envString(z.string()),
  CRM_INCENTIVE_MIN_SCORE: envString(z.string()),

  // Ops notifications & automation (optional)
  OPS_NOTIFY_EMAIL_TO: envString(z.string().email()),
  OPS_SLACK_WEBHOOK_URL: envString(z.string().url()),
  OPS_CALLMEBOT_PHONE: envString(z.string()),
  OPS_CALLMEBOT_APIKEY: envString(z.string()),

  OPS_BACKUP_MAX_AGE_HOURS: envString(z.string()),
  OPS_DR_DRILL_ENABLED: envString(z.string()),
  OPS_DR_DRILL_MAX_AGE_DAYS: envString(z.string()),

  OPS_INCIDENT_ACK_SLA_MINUTES: envString(z.string()),
  OPS_INCIDENT_RESOLVE_SLA_MINUTES: envString(z.string()),

  OPS_CIRCUIT_ENABLED: envString(z.string()),
  OPS_CIRCUIT_THRESHOLD: envString(z.string()),
  OPS_CIRCUIT_WINDOW_SECONDS: envString(z.string()),
  OPS_CIRCUIT_PAUSE_SECONDS: envString(z.string()),

  OPS_BREAKGLASS_SECRET: envString(z.string().min(16)),
  OPS_BREAKGLASS_ISSUER_TOKEN: envString(z.string().min(16)),

  OPS_ALERT_WEBHOOK_URL: envString(z.string().url()),
  OPS_ALERT_EMAIL_TO: envString(z.string().email()),
  OPS_ALERT_MIN_SEVERITY: envString(z.enum(['info', 'warn', 'critical'])),
  OPS_ALERT_DEDUP_TTL_SECONDS: envString(z.string()),

  OPS_DIGEST_ENABLED: envString(z.string()),
  OPS_DIGEST_EMAIL_TO: envString(z.string().email()),
  OPS_DIGEST_SUBJECT_PREFIX: envString(z.string()),

  // Security alerts (optional)
  SECURITY_ALERT_WEBHOOK_URL: envString(z.string().url()),
  SECURITY_ALERT_EMAIL_TO: envString(z.string().email()),
  SECURITY_ALERT_MIN_SEVERITY: envString(z.enum(['info', 'warn', 'critical'])),
  SECURITY_ALERT_DEDUP_TTL_SECONDS: envString(z.string()),

  // Perf budgets (optional)
  PERF_BUDGET_LCP_MS: envString(z.string()),
  PERF_BUDGET_INP_MS: envString(z.string()),
  PERF_BUDGET_CLS: envString(z.string()),
  PERF_BUDGET_CREATE_INCIDENT: envString(z.string()),

  // Robots/SEO flags
  ROBOTS_DISABLE_INDEXING: envString(z.string()),

  // AI (server) optional
  AI_PRIMARY: envString(z.enum(['gemini', 'openai'])),
  AI_SECONDARY: envString(z.enum(['gemini', 'openai'])),
  AI_ALLOWED_MODELS: envString(z.string()),
  AI_HTTP_TIMEOUT_MS: envString(z.string()),

  OPENAI_API_KEY: envString(z.string().min(1)),
  OPENAI_ORG: envString(z.string()),
  OPENAI_BASE_URL: envString(z.string().url()),
  OPENAI_MODEL: envString(z.string()),

  GEMINI_API_KEY: envString(z.string().min(1)),
  GEMINI_MODEL: envString(z.string()),
  GEMINI_API_URL: envString(z.string().url()),
});

/** Variables public (browser) */
const PublicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: envString(z.string().url()),
  NEXT_PUBLIC_VERCEL_URL: envString(z.string()),
  NEXT_PUBLIC_VERCEL_ENV: envString(z.enum(['production', 'preview', 'development'])),

  NEXT_PUBLIC_SUPABASE_URL: envString(z.string().url()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: envString(z.string().min(1)),

  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: envString(z.string()),

  NEXT_PUBLIC_CONTACT_EMAIL: envString(z.string().email()),
  NEXT_PUBLIC_WHATSAPP_NUMBER: envString(z.string()),
  NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE: envString(z.string()),

  NEXT_PUBLIC_SOCIAL_FACEBOOK_URL: envString(z.string().url()),
  NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL: envString(z.string().url()),
  NEXT_PUBLIC_SOCIAL_TIKTOK_URL: envString(z.string().url()),
  NEXT_PUBLIC_SOCIAL_X_URL: envString(z.string().url()),
  NEXT_PUBLIC_SOCIAL_YOUTUBE_URL: envString(z.string().url()),

  NEXT_PUBLIC_TURNSTILE_SITE_KEY: envString(z.string()),

  NEXT_PUBLIC_AI_MODEL: envString(z.string()),

  NEXT_PUBLIC_ROBOTS_DISABLE_INDEXING: envString(z.string()),
});

const server = ServerSchema.safeParse(raw);
const pub = PublicSchema.safeParse(raw);

// Warnings only once in dev (avoid spam with HMR)
const WARN_KEY = '__KCE_ENV_WARNED__';
const shouldWarn = (raw.NODE_ENV ?? 'development') !== 'production' && raw[WARN_KEY] !== '1';

if (!server.success && shouldWarn) console.warn('[env] Server env invalid:', server.error.issues);
if (!pub.success && shouldWarn) console.warn('[env] Public env invalid:', pub.error.issues);
if (shouldWarn) (raw as any)[WARN_KEY] = '1';

export type ServerEnv = z.infer<typeof ServerSchema>;
export type PublicEnv = z.infer<typeof PublicSchema>;

export const serverEnv = Object.freeze((server.success ? server.data : {}) as ServerEnv);
export const publicEnv = Object.freeze((pub.success ? pub.data : {}) as PublicEnv);

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */
export function boolEnv(v: string | undefined, fallback = false): boolean {
  const s = (v ?? '').trim().toLowerCase();
  if (!s) return fallback;
  return s === '1' || s === 'true' || s === 'yes' || s === 'on';
}

export function intEnv(v: string | undefined, fallback: number, opts?: { min?: number; max?: number }): number {
  const n = Number(String(v ?? '').trim());
  let val = Number.isFinite(n) ? Math.trunc(n) : fallback;
  if (typeof opts?.min === 'number') val = Math.max(opts.min, val);
  if (typeof opts?.max === 'number') val = Math.min(opts.max, val);
  return val;
}

export const isDev = (serverEnv.NODE_ENV ?? 'development') === 'development';
export const isProd = (serverEnv.NODE_ENV ?? 'development') === 'production';

export const isStripeMock = boolEnv(serverEnv.STRIPE_MOCK, false);
export const robotsDisabled = boolEnv(serverEnv.ROBOTS_DISABLE_INDEXING, false) || boolEnv(publicEnv.NEXT_PUBLIC_ROBOTS_DISABLE_INDEXING, false);

/* ─────────────────────────────────────────────────────────────
   URL helpers
   ───────────────────────────────────────────────────────────── */
function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

// Note:
// - Client only sees NEXT_PUBLIC_*.
// - On Vercel, server has VERCEL_URL (no protocol) as best preview fallback.
const isServer = typeof window === 'undefined';
const vercelUrlServer = isServer ? String(process.env.VERCEL_URL || '').trim() : '';

const _computedSiteUrl =
  publicEnv.NEXT_PUBLIC_SITE_URL?.trim() ||
  (publicEnv.NEXT_PUBLIC_VERCEL_URL ? `https://${publicEnv.NEXT_PUBLIC_VERCEL_URL}` : '') ||
  (vercelUrlServer ? `https://${vercelUrlServer}` : '') ||
  'http://localhost:3000';

export const SITE_URL = stripTrailingSlash(_computedSiteUrl);

export function absUrl(pathname: string): string {
  const p = (pathname || '').trim();
  if (!p) return SITE_URL;
  if (/^https?:\/\//i.test(p)) return p;
  const normalized = p.startsWith('/') ? p : `/${p}`;
  return `${SITE_URL}${normalized}`;
}

/* ─────────────────────────────────────────────────────────────
   Required getters
   ───────────────────────────────────────────────────────────── */
function readEnvRaw(key: string): string | undefined {
  return (process.env as Record<string, string | undefined>)[key];
}

export function mustGet<K extends keyof ServerEnv>(key: K): NonNullable<ServerEnv[K]> {
  const val = readEnvRaw(String(key)) ?? (serverEnv as any)[key];
  if (val == null || val === '') throw new Error(`Missing server env: ${String(key)}`);
  return val as NonNullable<ServerEnv[K]>;
}

export function mustGetPublic<K extends keyof PublicEnv>(key: K): NonNullable<PublicEnv[K]> {
  const val = readEnvRaw(String(key)) ?? (publicEnv as any)[key];
  if (val == null || val === '') throw new Error(`Missing public env: ${String(key)}`);
  return val as NonNullable<PublicEnv[K]>;
}
