import { generateMarketMetadata, renderMarketLanding, type MarketLandingConfig } from '@/features/marketing/MarketIntentLandingPage';

/**
 * Romantic Market Landing Configuration
 * Focus: Honeymoons, Anniversaries, Boutique Character and Memorable Rhythm.
 * Targeted at high-intent couples looking for atmosphere and trust.
 */
const config: MarketLandingConfig = {
  slug: 'romantic',
  title: 'Romantic Colombia journeys with boutique character',
  description:
    'A premium lane for couples, honeymoons and anniversaries that need warmth, elegance and a slower, more memorable travel rhythm.',
  eyebrow: 'Romantic intent lane',
  promiseTitle: 'Turn romantic travel intent into a premium Colombia shortlist',
  promiseBody:
    'This path is designed for couples who need confidence, atmosphere and a more boutique promise before they open the full catalog or book.',
  trustCards: [
    { 
      eyebrow: 'Boutique feel', 
      title: 'More atmosphere, less generic tourism' 
    },
    { 
      eyebrow: 'Clear route', 
      title: 'Shortlist, personalized planning and human help in one lane' 
    },
    { 
      eyebrow: 'Confident close', 
      title: 'Premium handoff when couples need reassurance' 
    },
  ],
  infoCards: [
    {
      title: 'Why this lane matters',
      body: 'Couples and honeymoon planners respond to mood, trust and curation. This lane frames Colombia as an elegant, memorable option instead of a noisy generic destination.',
    },
    {
      title: 'Best use case',
      body: 'Strong for anniversary campaigns, honeymoon content, boutique hotel partnerships and slower premium social traffic.',
    },
    {
      title: 'Commercial angle',
      body: 'Push the traveler from emotion into a clearer shortlist, then into human-assisted planning or secure checkout when intent is ready.',
    },
  ],
  ctaMessage: 'Hola KCE, quiero una shortlist romántica/premium para Colombia.',
  shortlistTitle: 'Curated tours for couples and boutique-feel planning',
  closeTitle: 'Use this lane to turn romantic demand into higher-quality close-ready conversations',
  closeBody:
    'Blend better mood-setting, boutique positioning and human planning support so romantic demand keeps moving toward real shortlist and booking intent.',
};

export async function generateMetadata() {
  return generateMarketMetadata(config);
}

export default async function RomanticLandingPage() {
  /**
   * renderMarketLanding ensures that the 'Romantic' mood 
   * is consistent with the boutique positioning of KCE.
   */
  return renderMarketLanding(config);
}