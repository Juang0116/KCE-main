import Link from 'next/link';

import OpenChatButton from '@/features/ai/OpenChatButton';
import PromptStarterButtons from '@/features/marketing/components/PromptStarterButtons';
import type { SupportedLocale } from '@/i18n/getDictionary';

function withLocale(locale: SupportedLocale, href: string) {
  if (!href.startsWith('/')) return href;
  if (/^\/(es|en|fr|de)(\/|$)/i.test(href)) return href;
  return href === '/' ? `/${locale}` : `/${locale}${href}`;
}

type Props = {
  locale: SupportedLocale;
  whatsAppHref?: string | null;
  className?: string;
};

type Copy = {
  eyebrow: string;
  title: string;
  body: string;
  primary: string;
  secondary: string;
  tertiary: string;
  chips: string[];
  cards: Array<{ title: string; copy: string }>;
  prompts: string[];
  promptLabel: string;
};

function getCopy(locale: SupportedLocale): Copy {
  switch (locale) {
    case 'en':
      return {
        eyebrow: 'AI concierge • connected to tours',
        title: 'Move from inspiration to shortlist and human handoff in one guided path.',
        body:
          'This layer turns the KCE chat into a true concierge: discover style, recommend real tours, save contact details and prepare the next commercial step without losing context.',
        primary: 'Open AI concierge',
        secondary: 'Browse tours',
        tertiary: 'Talk on WhatsApp',
        chips: ['Real catalog', 'Lead capture ready', 'Human handoff'],
        cards: [
          { title: 'Discover faster', copy: 'Ask for city, budget or travel style and reduce options in seconds.' },
          { title: 'Prepare closing', copy: 'When intent is strong, push to contact, personalized plan or checkout with less friction.' },
          { title: 'Keep the context', copy: 'Save email or WhatsApp so KCE can continue the conversation later.' },
        ],
        prompts: ['I want a cultural tour in Bogotá', 'We are 2 people and love coffee experiences', 'Help me choose between city and nature'],
        promptLabel: 'Prompt starters',
      };
    case 'fr':
      return {
        eyebrow: 'concierge IA • connecté aux tours',
        title: 'Passe de l’inspiration à la shortlist et au relais humain dans un seul parcours guidé.',
        body:
          'Cette couche transforme le chat KCE en vrai concierge : comprendre le style du voyageur, recommander des tours réels, capter le contact et préparer la prochaine étape commerciale sans perdre le contexte.',
        primary: 'Ouvrir le concierge IA',
        secondary: 'Voir les tours',
        tertiary: 'Parler sur WhatsApp',
        chips: ['Catalogue réel', 'Capture de lead prête', 'Relais humain'],
        cards: [
          { title: 'Découvrir plus vite', copy: 'Demande une ville, un budget ou un style et réduis les options en quelques secondes.' },
          { title: 'Préparer la conversion', copy: 'Quand l’intention monte, envoie vers contact, plan personnalisé ou checkout avec moins de friction.' },
          { title: 'Garder le contexte', copy: 'Sauvegarde email ou WhatsApp pour permettre à KCE de reprendre ensuite.' },
        ],
        prompts: ['Je veux un tour culturel à Bogotá', 'Nous sommes 2 et nous aimons le café', 'Aide-moi à choisir entre ville et nature'],
        promptLabel: 'Prompts de départ',
      };
    case 'de':
      return {
        eyebrow: 'AI concierge • mit Touren verbunden',
        title: 'Von Inspiration zur Shortlist und menschlichen Übergabe in einem klaren Flow.',
        body:
          'Diese Ebene macht den KCE-Chat zu einem echten Concierge: Reisetyp verstehen, reale Touren empfehlen, Kontaktdaten sichern und den nächsten kommerziellen Schritt vorbereiten — ohne Kontextverlust.',
        primary: 'AI Concierge öffnen',
        secondary: 'Touren ansehen',
        tertiary: 'Über WhatsApp sprechen',
        chips: ['Echter Katalog', 'Lead Capture bereit', 'Menschliche Übergabe'],
        cards: [
          { title: 'Schneller entdecken', copy: 'Frage nach Stadt, Budget oder Stil und reduziere Optionen in Sekunden.' },
          { title: 'Abschluss vorbereiten', copy: 'Wenn die Absicht steigt, leite sauber zu Kontakt, persönlichen Plan oder Checkout weiter.' },
          { title: 'Kontext behalten', copy: 'Speichere E-Mail oder WhatsApp, damit KCE später weitermachen kann.' },
        ],
        prompts: ['Ich möchte eine kulturelle Tour in Bogotá', 'Wir sind zu zweit und lieben Kaffee-Erlebnisse', 'Hilf mir zwischen Stadt und Natur zu wählen'],
        promptLabel: 'Startprompts',
      };
    default:
      return {
        eyebrow: 'AI concierge • conectado a tours reales',
        title: 'Pasa de inspiración a shortlist y handoff humano en una sola ruta guiada.',
        body:
          'Esta capa convierte el chat de KCE en un concierge de verdad: descubre el estilo del viajero, recomienda tours reales, guarda contacto y prepara el siguiente paso comercial sin perder el contexto.',
        primary: 'Abrir AI concierge',
        secondary: 'Ver tours',
        tertiary: 'Hablar por WhatsApp',
        chips: ['Catálogo real', 'Lead capture ready', 'Handoff humano'],
        cards: [
          { title: 'Descubre más rápido', copy: 'Pregunta por ciudad, presupuesto o estilo de viaje y reduce opciones en segundos.' },
          { title: 'Prepara el cierre', copy: 'Cuando la intención es fuerte, empuja a contacto, plan personalizado o checkout con menos fricción.' },
          { title: 'Mantén el contexto', copy: 'Guarda email o WhatsApp para que KCE continúe la conversación después.' },
        ],
        prompts: ['Quiero un tour cultural en Bogotá', 'Somos 2 personas y nos encanta el café', 'Ayúdame a elegir entre ciudad y naturaleza'],
        promptLabel: 'Prompts para arrancar',
      };
  }
}

export default function AIConciergeSpotlight({ locale, whatsAppHref, className }: Props) {
  const copy = getCopy(locale);

  return (
    <section className={[
      'mx-auto max-w-6xl overflow-hidden rounded-[calc(var(--radius)+0.75rem)] border border-[color:var(--color-border)]',
      'bg-[linear-gradient(135deg,rgba(12,31,69,0.96),rgba(14,57,122,0.94))] text-white shadow-hard',
      className || '',
    ].join(' ')}>
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-6 md:p-8 lg:p-10">
          <div className="inline-flex rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/76">
            {copy.eyebrow}
          </div>
          <h2 className="mt-4 max-w-3xl font-heading text-3xl leading-tight text-white md:text-[2.85rem]">
            {copy.title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82 md:text-base">
            {copy.body}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {copy.chips.map((chip) => (
              <span key={chip} className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-xs font-semibold text-white/82">
                {chip}
              </span>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <OpenChatButton className="px-5" variant="secondary">
              {copy.primary}
            </OpenChatButton>
            <Link
              href={withLocale(locale, '/tours')}
              className="inline-flex items-center rounded-full border border-white/12 bg-white/10 px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-white/14 hover:no-underline"
            >
              {copy.secondary}
            </Link>
            {whatsAppHref ? (
              <a
                href={whatsAppHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-white/12 bg-black/18 px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-black/26 hover:no-underline"
              >
                {copy.tertiary}
              </a>
            ) : null}
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/14 p-6 md:p-8 lg:border-l lg:border-t-0 lg:p-10">
          <div className="grid gap-3">
            {copy.cards.map((card, idx) => (
              <article key={card.title} className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4 shadow-soft backdrop-blur-xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/56">0{idx + 1}</div>
                <h3 className="mt-2 text-base font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/76">{card.copy}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-black/18 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/56">{copy.promptLabel}</div>
            <PromptStarterButtons prompts={copy.prompts} />
          </div>
        </div>
      </div>
    </section>
  );
}
