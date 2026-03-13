// src/lib/stripe.server.ts
import 'server-only';

import Stripe from 'stripe';
import { mustGet } from '@/lib/env';

function assertNodeRuntime(): void {
  if (process.env.NEXT_RUNTIME === 'edge') {
    throw new Error('[stripe] Stripe SDK requires Node.js runtime. Do not import in Edge.');
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __kce_stripe__: Stripe | undefined;
}

/**
 * Con exactOptionalPropertyTypes=true:
 * - si pasas apiVersion, NO puede ser undefined.
 * - por eso la tipamos como NonNullable<...>
 */
export const stripeApiVersion: NonNullable<Stripe.StripeConfig['apiVersion']> = '2025-08-27.basil';

export const stripeMode: 'live' | 'test' = (process.env.STRIPE_SECRET_KEY || '').includes('_live_')
  ? 'live'
  : 'test';

export const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY);

export function getStripe(): Stripe {
  assertNodeRuntime();

  if (globalThis.__kce_stripe__) return globalThis.__kce_stripe__;

  const key = mustGet('STRIPE_SECRET_KEY');

  const stripe = new Stripe(key, {
    apiVersion: stripeApiVersion,
    maxNetworkRetries: 2,
    appInfo: {
      name: 'KCE Web',
      version: '0.3.1',
      url: 'https://kce.travel',
    },
  });

  globalThis.__kce_stripe__ = stripe;
  return stripe;
}
