'use client';

import * as React from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

import { ChatMarkdown } from '@/components/ChatMarkdown';
import { AssistantMessageBlocks } from '@/features/ai/AssistantMessageBlocks';
import { buildContextHref, type MarketingLocale } from '@/features/marketing/contactContext';

type Role = 'user' | 'assistant';

type Msg = {
  id: string;
  role: Role;
  content: string;
  ts: number;
};

const STORAGE_KEY = 'kce.chat.v1';
const STORAGE_CID = 'kce.chat.cid.v1';
const STORAGE_LEAD = 'kce.chat.lead.v1';
const STORAGE_HANDOFF = 'kce.chat.handoff.v1';

type LeadDraft = {
  email?: string | undefined;
  whatsapp?: string | undefined;
  consent?: boolean | undefined;
  leadId?: string | undefined;
};

type HandoffState = {
  leadId?: string | undefined;
  ticketId?: string | undefined;
  dealId?: string | undefined;
  taskId?: string | undefined;
  requestedAt?: number | undefined;
};

const QUICK_PROMPTS = [
  'Busco un tour cultural en Bogotá',
  'Arma un plan de 3 días en Cartagena',
  'Somos 2 y queremos una experiencia de café',
  'Quiero ayuda para organizar mi viaje a Colombia',
];

const FOCUS_ACTIONS = [
  { title: 'Tours', prompt: 'Muéstrame 2 o 3 tours recomendados según mi idea de viaje.', copy: 'Ver opciones reales' },
  { title: 'Plan', prompt: 'Quiero un plan personalizado para mi viaje en Colombia.', copy: 'Diseñar mi viaje' },
  { title: 'Humano', prompt: 'Quiero que KCE me ayude personalmente con mi viaje.', copy: 'Escalar a KCE' },
] as const;

type ChatTrack = 'tour' | 'plan' | 'booking' | 'support' | 'general';

type ChatAction = {
  title: string;
  copy: string;
  kind: 'prompt' | 'link' | 'handoff' | 'lead';
  prompt?: string;
  href?: string;
};

function detectChatTrackFromText(text: string): ChatTrack {
  const value = String(text || '').toLowerCase();
  if (!value) return 'general';
  if (/soporte|support|ticket|problema|error|factura|invoice|meeting point|humano/.test(value)) return 'support';
  if (/booking|reserva|pago|checkout|cancel|refund|reembolso|charge/.test(value)) return 'booking';
  if (/plan|itiner|ruta|personalizado|custom/.test(value)) return 'plan';
  if (/tour|bogot|cartagen|victoria|caldas|catalog|destino/.test(value)) return 'tour';
  return 'general';
}

function detectChatTrack(messages: Msg[]): ChatTrack {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const fromUser = detectChatTrackFromText(lastUser);
  if (fromUser !== 'general') return fromUser;
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')?.content || '';
  return detectChatTrackFromText(lastAssistant);
}

function labelForTrack(track: ChatTrack) {
  if (track === 'tour') return 'Tours';
  if (track === 'plan') return 'Plan';
  if (track === 'booking') return 'Booking';
  if (track === 'support') return 'Soporte';
  return 'Descubrimiento';
}

function buildTrackActions(args: {
  track: ChatTrack;
  locale: MarketingLocale;
  contactHref: string;
  hasContact: boolean;
}): ChatAction[] {
  const planHref = buildContextHref(args.locale, '/plan', { source: 'chat' });
  const toursHref = buildContextHref(args.locale, '/tours', { source: 'chat' });

  if (args.track === 'plan') {
    return [
      { title: 'Abrir plan', copy: 'Completa ciudad, viajeros y presupuesto dentro del flujo premium.', kind: 'link', href: planHref },
      { title: 'Comparar opciones', copy: 'Pide 2 o 3 rutas claras antes de decidir.', kind: 'prompt', prompt: 'Compárame 2 o 3 opciones del catálogo según mi plan.' },
      { title: args.hasContact ? 'Escalar a KCE' : 'Guardar contacto', copy: args.hasContact ? 'Deja el caso listo para seguimiento humano con contexto.' : 'Deja email o WhatsApp para que KCE continúe contigo.', kind: args.hasContact ? 'handoff' : 'lead' },
    ];
  }

  if (args.track === 'booking' || args.track === 'support') {
    return [
      { title: 'Abrir contacto', copy: 'Pasa el caso con resumen y continuidad para que no empiece desde cero.', kind: 'link', href: args.contactHref },
      { title: args.hasContact ? 'Escalar a KCE' : 'Dejar contacto', copy: args.hasContact ? 'Solicita apoyo humano inmediato sobre este caso.' : 'Guarda tu canal de contacto antes del handoff.', kind: args.hasContact ? 'handoff' : 'lead' },
      { title: 'Pedir resumen', copy: 'Haz que el concierge te devuelva el siguiente paso en formato corto.', kind: 'prompt', prompt: 'Resume mi estado actual y dime el siguiente paso más útil.' },
    ];
  }

  if (args.track === 'tour') {
    return [
      { title: 'Ver tours', copy: 'Abre el catálogo para revisar opciones reales y seguir avanzando.', kind: 'link', href: toursHref },
      { title: 'Armar plan', copy: 'Pasa a plan personalizado si aún estás comparando fit, ritmo o presupuesto.', kind: 'link', href: planHref },
      { title: 'Hablar con KCE', copy: 'Abre contacto con el caso resumido cuando necesites ayuda humana.', kind: 'link', href: args.contactHref },
    ];
  }

  return [
    ...FOCUS_ACTIONS.map((action) => ({ ...action, kind: 'prompt' as const })),
  ];
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadMessages(): Msg[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Msg[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m) => m && typeof m === 'object')
      .slice(-50)
      .map((m) => {
        const rawRole = (m as any).role;
        const role: Role = rawRole === 'assistant' || rawRole === 'user' ? rawRole : 'user';
        const msg: Msg = {
          id: typeof (m as any).id === 'string' ? (m as any).id : uid(),
          role,
          content: String((m as any).content ?? ''),
          ts: typeof (m as any).ts === 'number' ? (m as any).ts : Date.now(),
        };
        return msg;
      })
      .filter((m) => m.content.trim().length > 0);
  } catch {
    return [];
  }
}

function saveMessages(messages: Msg[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
  } catch {
    // ignore quota
  }
}

function loadConversationId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_CID);
    const v = (raw || '').trim();
    return v || null;
  } catch {
    return null;
  }
}

function saveConversationId(cid: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (!cid) window.localStorage.removeItem(STORAGE_CID);
    else window.localStorage.setItem(STORAGE_CID, cid);
  } catch {
    // ignore
  }
}

function loadLeadDraft(): LeadDraft {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_LEAD);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LeadDraft;
    if (!parsed || typeof parsed !== 'object') return {};
    return {
      email: typeof (parsed as any).email === 'string' ? (parsed as any).email : undefined,
      whatsapp: typeof (parsed as any).whatsapp === 'string' ? (parsed as any).whatsapp : undefined,
      consent: typeof (parsed as any).consent === 'boolean' ? (parsed as any).consent : undefined,
    };
  } catch {
    return {};
  }
}

function saveLeadDraft(draft: LeadDraft) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_LEAD, JSON.stringify(draft));
  } catch {
    // ignore
  }
}

function loadHandoffState(): HandoffState {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_HANDOFF);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as HandoffState;
    if (!parsed || typeof parsed !== 'object') return {};
    return {
      leadId: typeof (parsed as any).leadId === 'string' ? (parsed as any).leadId : undefined,
      ticketId: typeof (parsed as any).ticketId === 'string' ? (parsed as any).ticketId : undefined,
      dealId: typeof (parsed as any).dealId === 'string' ? (parsed as any).dealId : undefined,
      taskId: typeof (parsed as any).taskId === 'string' ? (parsed as any).taskId : undefined,
      requestedAt: typeof (parsed as any).requestedAt === 'number' ? (parsed as any).requestedAt : undefined,
    };
  } catch {
    return {};
  }
}

function saveHandoffState(state: HandoffState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_HANDOFF, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function toApiMessages(messages: Msg[]) {
  return messages.slice(-20).map((m) => ({ role: m.role, content: m.content }));
}

function getMarketingLocale(): MarketingLocale {
  if (typeof document === 'undefined') return 'es';
  const raw = (document.documentElement.getAttribute('lang') || 'es').toLowerCase();
  if (raw.startsWith('en')) return 'en';
  if (raw.startsWith('fr')) return 'fr';
  if (raw.startsWith('de')) return 'de';
  return 'es';
}

function buildChatContactHref(args: {
  messages: Msg[];
  leadEmail: string;
  leadWhatsapp: string;
  ticketId: string | null;
  conversationId?: string | null;
  locale: MarketingLocale;
}) {
  const lastUser = [...args.messages].reverse().find((m) => m.role === 'user')?.content?.trim() || '';
  const recentSummary = args.messages
    .slice(-4)
    .map((m) => `${m.role === 'user' ? 'Traveler' : 'KCE'}: ${m.content}`)
    .join('\n')
    .slice(0, 600);
  const topic = /reserv|checkout|booking|pago/i.test(lastUser)
    ? 'booking'
    : /plan|itiner|custom/i.test(lastUser)
      ? 'plan'
      : /tour|bogot|cartagen|victoria|caldas/i.test(lastUser)
        ? 'tour'
        : 'chat';

  return buildContextHref(args.locale, '/contact', {
    source: 'chat',
    topic,
    email: args.leadEmail || undefined,
    whatsapp: args.leadWhatsapp || undefined,
    ticket: args.ticketId || undefined,
    conversation: args.conversationId || undefined,
    message: lastUser || recentSummary || 'Quiero continuar este caso con KCE.',
  });
}

function buildAccountSupportHref(locale: MarketingLocale, ticketId?: string | null) {
  if (!ticketId) return buildContextHref(locale, '/account/support', { source: 'chat' });
  return buildContextHref(locale, `/account/support/${encodeURIComponent(ticketId)}`, { source: 'chat-handoff', ticket: ticketId });
}

function buildAccountBookingsHref(locale: MarketingLocale) {
  return buildContextHref(locale, '/account/bookings', { source: 'chat' });
}


// ── UI strings (multilingual) ──────────────────────────────────────
const UI_STRINGS: Record<string, {
  placeholder: string; send: string; close: string; online: string;
  save: string; saving: string; escalate: string; escalating: string;
  consent: string; title: string; subtitle: string;
}> = {
  es: {
    placeholder: 'Cuéntanos ciudad, fechas o estilo de viaje…',
    send: 'Enviar', close: 'Cerrar chat', online: 'EN LÍNEA',
    save: 'Guardar contacto', saving: 'Guardando…',
    escalate: 'Escalar a KCE', escalating: 'Abriendo…',
    consent: 'Autorizo a KCE a contactarme.',
    title: 'KCE Concierge', subtitle: 'Tours · Planes · Soporte 24/7',
  },
  en: {
    placeholder: 'Tell us city, dates or travel style…',
    send: 'Send', close: 'Close chat', online: 'ONLINE',
    save: 'Save contact', saving: 'Saving…',
    escalate: 'Escalate to KCE', escalating: 'Opening…',
    consent: 'I authorize KCE to contact me.',
    title: 'KCE Concierge', subtitle: 'Tours · Plans · Support 24/7',
  },
  fr: {
    placeholder: 'Dites-nous ville, dates ou style de voyage…',
    send: 'Envoyer', close: 'Fermer', online: 'EN LIGNE',
    save: 'Sauvegarder', saving: 'Sauvegarde…',
    escalate: 'Escalader à KCE', escalating: 'Ouverture…',
    consent: "J'autorise KCE à me contacter.",
    title: 'KCE Concierge', subtitle: 'Tours · Plans · Support 24/7',
  },
  de: {
    placeholder: 'Stadt, Datum oder Reisestil mitteilen…',
    send: 'Senden', close: 'Schließen', online: 'ONLINE',
    save: 'Kontakt speichern', saving: 'Speichern…',
    escalate: 'An KCE eskalieren', escalating: 'Öffnen…',
    consent: 'Ich erlaube KCE, mich zu kontaktieren.',
    title: 'KCE Concierge', subtitle: 'Touren · Pläne · Support 24/7',
  },
};

export default function ChatWidget({ initialOpen = false }: { initialOpen?: boolean }) {
  const locale = getMarketingLocale();
  const ui = UI_STRINGS[locale] ?? UI_STRINGS['es']!;
  const [open, setOpen] = React.useState(false);
  const [unread, setUnread] = React.useState(false);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [leadEmail, setLeadEmail] = React.useState('');
  const [leadWhatsapp, setLeadWhatsapp] = React.useState('');
  const [leadConsent, setLeadConsent] = React.useState(false);
  const [showLeadForm, setShowLeadForm] = React.useState(false);
  const [savingLead, setSavingLead] = React.useState(false);
  const [requestingHandoff, setRequestingHandoff] = React.useState(false);
  const [leadId, setLeadId] = React.useState<string | null>(null);
  const [ticketId, setTicketId] = React.useState<string | null>(null);
  const [dealId, setDealId] = React.useState<string | null>(null);
  const [taskId, setTaskId] = React.useState<string | null>(null);

  const openChat = React.useCallback(() => {
    setOpen(true);
    setUnread(false);
    try {
      window.dispatchEvent(new CustomEvent('kce:chat-opened'));
    } catch {
      window.dispatchEvent(new Event('kce:chat-opened'));
    }
  }, []);

  React.useEffect(() => {
    if (!initialOpen) return;
    const t = window.setTimeout(() => openChat(), 0);
    return () => window.clearTimeout(t);
  }, [initialOpen, openChat]);

  const closeChat = React.useCallback(() => {
    setOpen(false);
    try {
      if (typeof window !== 'undefined' && window.location.hash === '#chat') {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch {
      // ignore
    }
    try {
      window.dispatchEvent(new CustomEvent('kce:chat-closed'));
    } catch {
      window.dispatchEvent(new Event('kce:chat-closed'));
    }
  }, []);

  const toggleChat = React.useCallback(() => {
    setOpen((v) => {
      const next = !v;
      if (next) setUnread(false);
      return next;
    });
  }, []);

  const listRef = React.useRef<HTMLDivElement | null>(null);
  const continuityStatus = React.useMemo(() => {
    if (taskId || dealId || ticketId) {
      return 'Tu caso ya quedó encaminado dentro de KCE y podemos continuar sin perder el contexto.';
    }
    if (leadId || leadEmail.trim() || leadWhatsapp.trim()) {
      return 'Ya tenemos datos básicos para continuar contigo si necesitas ayuda humana o seguimiento.';
    }
    return 'Aún no has dejado datos de continuidad. Puedes seguir por chat o compartir email / WhatsApp cuando quieras.';
  }, [dealId, leadEmail, leadId, leadWhatsapp, taskId, ticketId]);

  React.useEffect(() => {
    const initial = loadMessages();
    setConversationId(loadConversationId());
    const ld = loadLeadDraft();
    setLeadEmail(ld.email ?? '');
    setLeadWhatsapp(ld.whatsapp ?? '');
    setLeadConsent(Boolean(ld.consent));
    setLeadId(ld.leadId ?? null);
    const hs = loadHandoffState();
    setTicketId(hs.ticketId ?? null);
    setDealId(hs.dealId ?? null);
    setTaskId(hs.taskId ?? null);

    if (initial.length === 0) {
      setMessages([
        {
          id: uid(),
          role: 'assistant',
          content: `## Resumen\nSoy el concierge de KCE. Puedo recomendarte tours reales, armar un plan de viaje día a día con Gemini, o conectarte con el equipo.\n\n## Opciones\n- **Explorar tours** del catálogo por ciudad o estilo\n- **Armar un plan** de 2-5 días con horarios, costos y recomendaciones locales\n- **Hablar con el equipo** si necesitas ayuda personalizada\n\n## Siguiente paso\nCuéntame: ¿qué ciudad(es) quieres visitar, cuántos días tienes y cuántas personas viajan?`,
          ts: Date.now(),
        },
      ]);
    } else {
      setMessages(initial);
    }
  }, []);

  React.useEffect(() => {
    function onOpen(ev?: Event) {
      const prompt = (ev as CustomEvent<{ prompt?: string }> | undefined)?.detail?.prompt;
      if (typeof prompt === 'string' && prompt.trim()) setInput(prompt.trim());
      openChat();
    }
    function onClose() { closeChat(); }
    function onToggle() { toggleChat(); }
    function onHash() {
      try { if (window.location.hash === '#chat') openChat(); } catch { /* ignore */ }
    }

    window.addEventListener('kce:open-chat', onOpen as any);
    window.addEventListener('kce:close-chat', onClose as any);
    window.addEventListener('kce:toggle-chat', onToggle as any);
    window.addEventListener('hashchange', onHash as any);
    onHash();

    (window as any).kce = (window as any).kce || {};
    (window as any).kce.openChat = openChat;
    (window as any).kce.closeChat = closeChat;
    (window as any).kce.toggleChat = toggleChat;

    return () => {
      window.removeEventListener('kce:open-chat', onOpen as any);
      window.removeEventListener('kce:close-chat', onClose as any);
      window.removeEventListener('kce:toggle-chat', onToggle as any);
      window.removeEventListener('hashchange', onHash as any);
    };
  }, [openChat, closeChat, toggleChat]);

  React.useEffect(() => {
    const evName = open ? 'kce:chat-opened' : 'kce:chat-closed';
    window.dispatchEvent(new CustomEvent(evName));
  }, [open]);

  React.useEffect(() => {
    saveMessages(messages);
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, showLeadForm]);

  const hasContact = leadConsent && (leadEmail.trim().length > 0 || leadWhatsapp.trim().length > 0);
  const marketingLocale = React.useMemo(() => getMarketingLocale(), []);
  const contactHref = React.useMemo(() => buildChatContactHref({
    messages, leadEmail: leadEmail.trim(), leadWhatsapp: leadWhatsapp.trim(), ticketId, conversationId, locale,
  }), [messages, leadEmail, leadWhatsapp, ticketId, conversationId, locale]);
  const supportHref = React.useMemo(() => buildAccountSupportHref(marketingLocale, ticketId), [marketingLocale, ticketId]);
  const bookingsHref = React.useMemo(() => buildAccountBookingsHref(marketingLocale), [marketingLocale]);
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant')?.content || '';
  const lastMsgHasPlan = /##\s*(tu plan|plan de viaje|your travel plan|ton plan|dein reise)/i.test(lastAssistantMsg);

  const activeTrack = React.useMemo(() => detectChatTrack(messages), [messages]);
  const trackActions = React.useMemo(
    () => buildTrackActions({ track: activeTrack, locale: marketingLocale, contactHref, hasContact }),
    [activeTrack, contactHref, hasContact],
  );
  const continuityBadges = React.useMemo(
    () => [labelForTrack(activeTrack), leadEmail.trim() ? 'Email' : null, leadWhatsapp.trim() ? 'WhatsApp' : null, ticketId ? 'Ticket' : null, dealId ? 'Deal' : null, taskId ? 'Task' : null].filter(Boolean) as string[],
    [activeTrack, dealId, leadEmail, leadWhatsapp, taskId, ticketId],
  );

  async function persistLeadToCrm() {
    if (!hasContact || savingLead) return null;
    setErr(null); setSavingLead(true);
    try {
      const locale = typeof document !== 'undefined' ? document.documentElement.getAttribute('lang') || 'es' : 'es';
      const res = await fetch('/api/bot/create-lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...(leadEmail.trim() ? { email: leadEmail.trim() } : {}),
          ...(leadWhatsapp.trim() ? { whatsapp: leadWhatsapp.trim() } : {}),
          source: 'webchat', language: locale, consent: true,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar el lead');
      const nextLeadId = typeof data?.leadId === 'string' ? data.leadId : null;
      setLeadId(nextLeadId);
      const draft: LeadDraft = { consent: leadConsent };
      const e = leadEmail.trim(); const w = leadWhatsapp.trim();
      if (e) draft.email = e; if (w) draft.whatsapp = w; if (nextLeadId) draft.leadId = nextLeadId;
      saveLeadDraft(draft);
      setMessages((prev) => [...prev, { id: uid(), role: 'assistant', content: '## Continuidad\nPerfecto. Tu contacto quedó guardado para que KCE pueda retomar tu caso sin perder el contexto.', ts: Date.now() }]);
      return nextLeadId;
    } catch (e: any) {
      setErr(e?.message || 'No se pudo guardar el lead'); return null;
    } finally {
      setSavingLead(false);
    }
  }

  async function requestHumanHandoff() {
    if (!hasContact || requestingHandoff) return;
    setErr(null); setRequestingHandoff(true);
    try {
      const ensuredLeadId = leadId || (await persistLeadToCrm());
      const locale = typeof document !== 'undefined' ? document.documentElement.getAttribute('lang') || 'es' : 'es';
      const summary = messages.slice(-4).map((m) => `${m.role === 'user' ? 'Traveler' : 'KCE'}: ${m.content}`).join('\n').slice(0, 1800) || 'Traveler requested human follow-up from chat.';
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || 'Necesito ayuda humana para seguir con la reserva.';
      const topic = /reserv|checkout|booking|pago/i.test(lastUserMessage) ? 'booking' : /plan|itiner|custom/i.test(lastUserMessage) ? 'plan' : /tour|bogot|cartagen|victoria|caldas/i.test(lastUserMessage) ? 'tour' : 'chat';
      const city = /cartagena/i.test(lastUserMessage) ? 'Cartagena' : /victoria|caldas/i.test(lastUserMessage) ? 'La Victoria, Caldas' : /bogot/i.test(lastUserMessage) ? 'Bogotá' : undefined;
      const res = await fetch('/api/bot/create-ticket', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...(conversationId ? { conversationId } : {}), channel: 'webchat', locale, consent: true,
          lead: { ...(leadEmail.trim() ? { email: leadEmail.trim() } : {}), ...(leadWhatsapp.trim() ? { whatsapp: leadWhatsapp.trim() } : {}), source: 'webchat.handoff' },
          topic, salesContext: { city, query: lastUserMessage }, summary: `Human handoff requested. ${summary}`, priority: 'high', lastUserMessage,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) throw new Error(data?.error || 'No se pudo crear el handoff');
      const nextConversationId = typeof data?.conversationId === 'string' ? data.conversationId : null;
      const nextTicketId = typeof data?.ticketId === 'string' ? data.ticketId : null;
      const nextDealId = typeof data?.dealId === 'string' ? data.dealId : null;
      const nextTaskId = typeof data?.taskId === 'string' ? data.taskId : null;
      if (nextConversationId) { setConversationId(nextConversationId); saveConversationId(nextConversationId); }
      if (nextTicketId) setTicketId(nextTicketId);
      if (nextDealId) setDealId(nextDealId);
      if (nextTaskId) setTaskId(nextTaskId);
      if (nextTicketId || nextDealId || nextTaskId) {
        saveHandoffState({ leadId: ensuredLeadId || undefined, ticketId: nextTicketId || undefined, dealId: nextDealId || undefined, taskId: nextTaskId || undefined, requestedAt: Date.now() });
      }
      setMessages((prev) => [...prev, { id: uid(), role: 'assistant', content: nextTicketId ? `## Continuidad\nListo. Ya abrí la ayuda humana y la asocié a tu conversación. Ticket: ${nextTicketId}.${nextDealId ? ` Deal: ${nextDealId}.` : ''} KCE puede retomar por email o WhatsApp con el contexto completo.` : '## Continuidad\nListo. Ya solicité el handoff humano para que KCE continúe tu seguimiento.', ts: Date.now() }]);
      setShowLeadForm(false);
    } catch (e: any) {
      setErr(e?.message || 'No se pudo crear el handoff');
    } finally {
      setRequestingHandoff(false);
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setErr(null); setSending(true);

    const userMsg: Msg = { id: uid(), role: 'user', content: trimmed, ts: Date.now() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages); setInput('');

    try {
      const locale = typeof document !== 'undefined' ? document.documentElement.getAttribute('lang') || undefined : undefined;
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(locale ? { 'x-locale': locale } : {}) },
        body: JSON.stringify({
          messages: toApiMessages(nextMessages), locale, ...(conversationId ? { conversationId } : {}),
          ...(leadConsent ? { lead: { ...(leadEmail.trim() ? { email: leadEmail.trim() } : {}), ...(leadWhatsapp.trim() ? { whatsapp: leadWhatsapp.trim() } : {}), source: 'webchat' }, consent: true } : {}),
        }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) {
        if (res.status === 429) {
          const retryAfter = res.headers.get('Retry-After');
          const seconds = retryAfter ? parseInt(retryAfter, 10) : NaN;
          const friendly = Number.isFinite(seconds) && seconds > 0 ? `Estamos recibiendo muchas solicitudes. Intenta de nuevo en ~${seconds}s.` : 'Estamos recibiendo muchas solicitudes. Intenta de nuevo en unos segundos.';
          setMessages((prev) => [...prev, { id: uid(), role: 'assistant', content: friendly, ts: Date.now() }]);
          setErr(null); return;
        }
        throw new Error(data?.error || data?.message || 'Error al contactar la IA');
      }

      const assistantText = String(data?.content ?? '').trim() || 'Listo. ¿En qué más te ayudo?';
      setMessages((prev) => [...prev, { id: uid(), role: 'assistant', content: assistantText, ts: Date.now() }]);

      const cid = typeof data?.conversationId === 'string' ? data.conversationId.trim() : '';
      if (cid) { setConversationId(cid); saveConversationId(cid); }

      const returnedTicketId = typeof data?.ticketId === 'string' ? data.ticketId.trim() : '';
      if (returnedTicketId) {
        setTicketId(returnedTicketId);
        saveHandoffState({ leadId: leadId || undefined, ticketId: returnedTicketId, dealId: dealId || undefined, taskId: taskId || undefined, requestedAt: Date.now() });
      }

      const lower = assistantText.toLowerCase();
      if (lower.includes('email') || lower.includes('whatsapp') || lower.includes('consent') || lower.includes('contactarte')) {
        setShowLeadForm(true);
      }
      if (!open) setUnread(true);
    } catch (e: any) {
      setErr(e?.message || 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={open ? ui.close : ui.title}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="kce-chat-dialog"
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (next) setUnread(false);
            return next;
          });
        }}
        className={[
          'fixed bottom-24 right-6 z-50 inline-flex size-14 items-center justify-center rounded-full',
          'bg-brand-blue text-white shadow-soft transition hover:scale-105 hover:shadow-pop',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/30',
        ].join(' ')}
      >
        <div className="relative">
          {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
          {unread ? (
            <span className="absolute -right-1 -top-1 inline-block size-2 rounded-full bg-brand-yellow" />
          ) : null}
        </div>
      </button>

      {open ? (
        <div
          role="dialog"
          id="kce-chat-dialog"
          aria-modal="true"
          aria-labelledby="kce-chat-title"
          className={[
            'fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-pop',
            'bottom-40 right-4 w-[min(calc(100vw-2rem),26rem)] max-h-[min(calc(100svh-12rem),600px)]',
          ].join(' ')}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-[color:var(--color-border)] px-4 py-3 bg-[color:var(--color-surface)]">
            <div className="min-w-0 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-blue shrink-0">
                <span className="text-white font-heading text-xs font-bold">KCE</span>
              </div>
              <div>
                <h2 id="kce-chat-title" className="truncate font-heading text-brand-blue text-sm">
                  {ui.title}
                </h2>
                <p className="text-[color:var(--color-text-muted)] text-[10px] leading-tight">
                  {ui.subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Online
              </div>
              <button
                type="button"
                className="text-[color:var(--color-text-muted)] rounded-lg p-2 hover:bg-[color:var(--color-surface-2)] transition-colors"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div ref={listRef} className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[color:var(--color-surface)]">
            
            <div className="shrink-0 border-b border-[color:var(--color-border)] px-4 py-3">
              <div className="mb-3 grid gap-2 sm:grid-cols-3">
                {trackActions.map((action) => {
                  const common = 'rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 text-left transition hover:bg-[color:var(--color-surface)]';
                  if (action.kind === 'link' && action.href) {
                    return (
                      <a key={action.title} href={action.href} className={common}>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)] opacity-80">{action.title}</div>
                        <div className="mt-1 text-[11px] leading-5 text-[color:var(--color-text-muted)]">{action.copy}</div>
                      </a>
                    );
                  }
                  return (
                    <button
                      key={action.title}
                      type="button"
                      onClick={() => {
                        if (action.kind === 'prompt' && action.prompt) { setInput(action.prompt); if (!open) setOpen(true); return; }
                        if (action.kind === 'handoff') { if (hasContact) void requestHumanHandoff(); else setShowLeadForm(true); return; }
                        if (action.kind === 'lead') { setShowLeadForm(true); }
                      }}
                      className={common}
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)] opacity-80">{action.title}</div>
                      <div className="mt-1 text-[11px] leading-5 text-[color:var(--color-text-muted)]">{action.copy}</div>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt} type="button" onClick={() => void sendMessage(prompt)} disabled={sending}
                    className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-1.5 text-left text-[11px] font-medium text-[color:var(--color-text)] transition hover:bg-[color:var(--color-surface)] disabled:opacity-60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)] opacity-80">Ruta activa</div>
                  <div className="mt-1 text-[11px] leading-5 text-[color:var(--color-text-muted)]">Ahora el chat está priorizando: <strong>{labelForTrack(activeTrack)}</strong>. Cambia de carril con plan, tours o handoff cuando lo necesites.</div>
                </div>
                <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-text)] opacity-80">Estado del contacto</div>
                  <div className="mt-1 text-[11px] leading-5 text-[color:var(--color-text-muted)]">{continuityStatus}</div>
                  {continuityBadges.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {continuityBadges.map((badge) => (
                        <span key={badge} className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
                          {badge}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex-1 px-4 py-4 space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={[
                      'max-w-[88%] rounded-2xl px-4 py-3.5 text-sm shadow-sm',
                      m.role === 'user' ? 'bg-brand-blue text-white' : 'border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] text-[color:var(--color-text)]',
                    ].join(' ')}
                  >
                    <div className={['mb-2 text-[10px] font-semibold uppercase tracking-[0.16em]', m.role === 'user' ? 'text-white opacity-90' : 'text-[color:var(--color-text-muted)]'].join(' ')}>
                      {m.role === 'user' ? 'Viajero' : 'KCE concierge'}
                    </div>
                    {m.role === 'assistant' ? <AssistantMessageBlocks content={m.content} /> : <ChatMarkdown content={m.content} tone="inverse" />}
                  </div>
                </div>
              ))}
              {sending ? (
                <div className="flex justify-start">
                  <div className="text-[color:var(--color-text-muted)] rounded-2xl bg-[color:var(--color-surface-2)] px-3 py-2 text-sm border border-[color:var(--color-border)]">Escribiendo…</div>
                </div>
              ) : null}
              {err ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-700">{err}</div>
              ) : null}
            </div>

            {lastMsgHasPlan && (
              <div className="shrink-0 border-t-2 border-brand-yellow/30 bg-brand-yellow/10 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-semibold text-[color:var(--color-text)]">
                    📅 ¿Quieres este plan con email y PDF?
                  </div>
                  <a
                    href={`/${marketingLocale}/plan`}
                    className="rounded-full bg-brand-blue px-4 py-1.5 text-xs font-bold text-white transition hover:bg-brand-blue/90"
                    target="_blank" rel="noopener noreferrer"
                  >
                    Abrir formulario completo →
                  </a>
                </div>
              </div>
            )}

            <div className="shrink-0 border-t border-[color:var(--color-border)] px-4 py-3">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl bg-[color:var(--color-surface-2)] px-3 py-2 text-left text-xs text-[color:var(--color-text)] border border-transparent transition hover:border-brand-dark/15"
                onClick={() => setShowLeadForm((v) => !v)}
                aria-expanded={showLeadForm}
              >
                <span>{leadConsent && (leadEmail.trim() || leadWhatsapp.trim()) ? '✅ Contacto listo para continuar' : 'Contacto y continuidad con KCE'}</span>
                <span className="text-[color:var(--color-text-muted)]">{showLeadForm ? '—' : '+'}</span>
              </button>

              {hasContact && !showLeadForm ? (
                <div className="mt-2 space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-[11px] text-emerald-700 dark:text-emerald-200">
                  <div>Tu contacto quedó listo para que KCE retome este caso por email o WhatsApp sin perder el contexto.</div>
                </div>
              ) : null}

              {showLeadForm ? (
                <div className="mt-3 space-y-2 pb-2">
                  <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 py-2 text-[11px] leading-5 text-[color:var(--color-text-muted)]">
                    Qué ocurre al dejar tu contacto: KCE guarda este caso, mantiene el contexto del chat y deja la conversación lista para seguimiento comercial o soporte.
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <input value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} placeholder="Email" className="h-10 w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-muted)] focus:ring-2 focus:ring-brand-blue/30" />
                    <input value={leadWhatsapp} onChange={(e) => setLeadWhatsapp(e.target.value)} placeholder="WhatsApp (+57…)" className="h-10 w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-muted)] focus:ring-2 focus:ring-brand-blue/30" />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-[color:var(--color-text)] cursor-pointer">
                    <input type="checkbox" checked={leadConsent} onChange={(e) => setLeadConsent(e.target.checked)} className="size-4 rounded border-brand-dark/15 text-brand-blue focus:ring-brand-blue" />
                    {ui.consent}
                  </label>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="flex flex-wrap items-center justify-end gap-2 w-full">
                      <button
                        type="button" disabled={!hasContact || !leadConsent || savingLead}
                        className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-xs text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-2)] transition-colors disabled:opacity-50"
                        onClick={() => {
                          const draft: LeadDraft = { consent: leadConsent };
                          const e = leadEmail.trim(); const w = leadWhatsapp.trim();
                          if (e) draft.email = e; if (w) draft.whatsapp = w; if (leadId) draft.leadId = leadId;
                          saveLeadDraft(draft);
                          void persistLeadToCrm();
                        }}
                      >
                        {savingLead ? ui.saving : ui.save}
                      </button>
                      <button
                        type="button" onClick={() => void requestHumanHandoff()} disabled={!hasContact || !leadConsent || requestingHandoff}
                        className="rounded-xl bg-brand-blue px-3 py-2 text-xs text-white hover:bg-brand-blue/90 transition-colors disabled:opacity-50"
                      >
                        {requestingHandoff ? ui.escalating : ui.escalate}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <form
            className="flex shrink-0 items-center gap-2 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3"
            onSubmit={(e) => { e.preventDefault(); void sendMessage(input); }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={ui.placeholder}
              className="h-10 flex-1 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 text-sm outline-none focus:ring-2 focus:ring-brand-blue/30 text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-muted)]"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || input.trim().length === 0}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue text-white disabled:opacity-50 transition-colors hover:bg-brand-blue/90"
              aria-label="Enviar"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}