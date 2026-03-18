import { generateMarketMetadata, renderMarketLanding, type MarketLandingConfig } from '@/features/marketing/MarketIntentLandingPage';

/**
 * Remote Work Market Landing Configuration
 * Focus: Flexibility, Slower Pacing, Lifestyle integration, and Long-stay trust.
 * Targeted at digital nomads, flexible professionals, and creative sabbaticals.
 */
const config: MarketLandingConfig = {
  slug: 'remote-work',
  title: 'Remote-work and slower-stay Colombia planning',
  description:
    'A more structured lane for flexible professionals, creative sabbaticals and longer-stay travelers comparing Colombia as a live-work destination.',
  eyebrow: 'Remote-work lane',
  promiseTitle: 'Turn longer-stay curiosity into structured Colombia planning',
  promiseBody:
    'This route is built for travelers who need more than a day-tour mindset: they want flexibility, confidence and a smarter shortlist for a slower Colombia stay.',
  trustCards: [
    { 
      eyebrow: 'Structured route', 
      title: 'Clear next steps for longer-stay planning' 
    },
    { 
      eyebrow: 'Flexible discovery', 
      title: 'Browse tours without losing bigger-trip context' 
    },
    { 
      eyebrow: 'Human backup', 
      title: 'Ask KCE when the trip needs custom guidance' 
    },
  ],
  infoCards: [
    {
      title: 'Why this lane matters',
      body: 'Remote-work travelers are rarely ready for immediate checkout. They need trust, city context, slower rhythm and enough support to keep exploring inside the KCE ecosystem.',
    },
    {
      title: 'Best use case',
      body: 'Useful for digital-nomad content, relocation-friendly traffic, lifestyle newsletters and long-tail SEO around slower Colombia stays.',
    },
    {
      title: 'Commercial angle',
      body: 'Use tours as part of the value stack while the traveler warms up through content, matcher, newsletter or human handoff.',
    },
  ],
  ctaMessage: 'Hola KCE, quiero una ruta para remote work / slow travel en Colombia.',
  shortlistTitle: 'Tours that fit longer-stay and flexible travel intent',
  closeTitle: 'Use this lane to turn slow-travel interest into qualified human conversation',
  closeBody:
    'Give remote-work demand a more mature route into KCE so the traveler can browse, compare and ask for help without dropping out of the funnel early.',
};

export async function generateMetadata() {
  return generateMarketMetadata(config);
}

export default async function RemoteWorkLandingPage() {
  /**
   * The renderMarketLanding function will automatically apply the
   * "Slower Stay" narrative through these configs, ensuring the 
   * UI matches the mental model of a nomad or remote worker.
   */
  return renderMarketLanding(config);
}