// src/types/global.d.ts
export {};

declare global {
  /** Payload opcional que puede incluir el botón/origen que abrió el chat. */
  interface KCEOpenChatDetail {
    /** Origen (útil para analytics/debug). */
    source?: 'button' | 'link' | 'cta' | 'system' | string;
  }

  /** API global expuesta por el ChatWidget al montar. */
  interface KCEChatAPI {
    /** Abre el widget de chat. */
    openChat: () => void;
    /** Cierra el widget de chat. */
    closeChat: () => void;
    /** Alterna el estado del widget de chat. */
    toggleChat: () => void;
  }

  interface Window {
    /** Helper global (inyectado por ChatWidget). */
    kce?: KCEChatAPI;
  }

  // Eventos personalizados del chat (fuertemente tipados)
  interface WindowEventMap {
    /** Solicitud para abrir el chat (CustomEvent con detail opcional). */
    'kce:open-chat': CustomEvent<KCEOpenChatDetail>;
    /** Solicitud para cerrar el chat. */
    'kce:close-chat': Event;
    /** Solicitud para alternar el chat. */
    'kce:toggle-chat': Event;
  }
}

// ---------------------------------------------------------------------------
// Fase 1 — Declaraciones de módulos para silenciar TS2307 / TS2882
// ---------------------------------------------------------------------------

/** `server-only` marca un módulo como exclusivo de servidor.
 *  No exporta nada; su efecto es producir un error en tiempo de build
 *  si se importa desde un Client Component. */
declare module 'server-only' {}

/** Declaración de módulo para el CSS global (satisface verbatimModuleSyntax). */
declare module '*/globals.css' {}
declare module '*/brand.css' {}
