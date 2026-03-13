// src/app/(marketing)/destinos/[slug]/page.tsx
// Spanish alias → canonical /destinations/[slug]

import { redirect } from 'next/navigation';

export default async function DestinosSlugRedirect(ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  redirect(`/destinations/${encodeURIComponent(slug)}`);
}
