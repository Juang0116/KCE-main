import { generateMarketMetadata, renderMarketLanding, type MarketLandingConfig } from '@/features/marketing/MarketIntentLandingPage';

const config: MarketLandingConfig = {
  slug: 'uk',
  title: 'Colombia journeys for UK-based travellers',
  description:
    'A cleaner route for UK-based travelers looking for premium planning, cultural depth and a shortlist that feels safe, polished and easy to act on.',
  eyebrow: 'UK demand lane',
  promiseTitle: 'Move UK traffic from curiosity to shortlist-ready demand',
  promiseBody:
    'This page is designed for travelers comparing long-haul options and needing confidence, structure and a premium planning rhythm before they commit.',
  trustCards: [
    { eyebrow: 'Premium feel', title: 'Shortlists that look curated, not generic' },
    { eyebrow: 'Planning clarity', title: 'Clear next steps from browse to checkout' },
    { eyebrow: 'Human help', title: 'WhatsApp handoff when the traveler needs it' },
  ],
  infoCards: [
    {
      title: 'Why this lane matters',
      body: 'UK-based travelers often compare Colombia against several premium long-haul options. KCE wins by reducing friction and making planning feel more guided.',
    },
    {
      title: 'Best use case',
      body: 'Strong for paid campaigns, partnerships, editorial referrals and social traffic where the visitor still needs reassurance before opening the catalog.',
    },
    {
      title: 'Planning route',
      body: 'Guide interest into tours, a personalized plan or human conversation depending on how ready the traveler feels.',
    },
  ],
  ctaMessage: 'Hola KCE, viajo desde Reino Unido y quiero una shortlist premium para Colombia.',
  shortlistTitle: 'Tours that fit a UK premium-planning mindset',
  closeTitle: 'Use this lane to turn UK demand into qualified conversations',
  closeBody:
    'Blend content, shortlist-ready tours and human support so colder international traffic keeps moving inside KCE instead of bouncing before the booking stage.',
};

export async function generateMetadata() {
  return generateMarketMetadata(config);
}

export default async function UkLandingPage() {
  return renderMarketLanding(config);
}
