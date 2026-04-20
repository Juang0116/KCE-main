// src/types/supabase.ts
// Tipos “a mano” inspirados en el generador oficial de Supabase.
// Cuando conectes el generador, podrás reemplazar este archivo.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/**
 * Truco para evitar el lint `no-redundant-type-constituents` en uniones tipo:
 * "pending" | "approved" | string
 * ESLint considera que los literales están "cubiertos" por `string`.
 *
 * Con `AnyString = string & {}` logramos “cualquier string” sin que ESLint lo marque como redundante.
 */
type AnyString = string & {};

type LooseRow = {
  id?: string;
  created_at?: string | null;
  updated_at?: string | null;
} & Record<string, Json | undefined>;

type LooseInsert = Record<string, Json | undefined>;
type LooseUpdate = Record<string, Json | undefined>;

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | AnyString;

/** Esquema principal de la BD (public) */
export type Database = {
  public: {
    Tables: {
      /* ======================= bookings ======================= */
      bookings: {
        Row: {
          id: string;
          created_at: string | null;
          updated_at: string | null;

          // core — fecha simple (legacy) + rango multi-día
          date: string;
          start_date: string | null;   // Fase 3: inicio del rango
          end_date: string | null;     // Fase 3: fin del rango
          persons: number;

          tour_id: string | null;

          status: string | null;
          total: number | null;

          // money
          currency: string | null;
          origin_currency: string | null;
          tour_price_minor: number | null;

          // customer
          customer_email: string | null;
          customer_name: string | null;
          phone: string | null;

          // provider
          payment_provider: string | null;
          stripe_session_id: string | null;

          // analytics
          view_count: number;

          // auth
          user_id: string | null;

          // extra data
          extras: Json | null;

          // CRM link
          deal_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          date: string;
          start_date?: string | null;
          end_date?: string | null;
          persons: number;
          tour_id?: string | null;
          status?: string | null;
          total?: number | null;
          currency?: string | null;
          origin_currency?: string | null;
          tour_price_minor?: number | null;
          customer_email?: string | null;
          customer_name?: string | null;
          phone?: string | null;
          payment_provider?: string | null;
          stripe_session_id?: string | null;
          view_count?: number;
          user_id?: string | null;
          extras?: Json | null;
          deal_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'bookings_tour_id_fkey';
            columns: ['tour_id'];
            isOneToOne: false;
            referencedRelation: 'tours';
            referencedColumns: ['id'];
          },
        ];
      };

      /* ======================== event_locks ======================== */
      event_locks: {
        Row: {
          key: string;
          created_at: string;
        };
        Insert: {
          key: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['event_locks']['Insert']>;
        Relationships: [];
      };

      /* ======================== events ======================== */
      events: {
        Row: {
          id: string;
          user_id: string | null;
          type: string;
          payload: Json | null;
          created_at: string | null;
          source: string | null;
          entity_id: string | null;
          dedupe_key: string | null;
        };
        Insert: {
          user_id?: string | null;
          type: string;
          payload?: Json | null;
          created_at?: string | null;
          source?: string | null;
          entity_id?: string | null;
          dedupe_key?: string | null;
        };
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
        Relationships: [];
      };

      /* ========================= customers (CRM) ========================= */
      customers: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          phone: string | null;
          country: string | null;
          language: string | null;
          created_at: string;
          identity_status: 'none' | 'pending' | 'verified' | 'rejected' | null;
          identity_doc_path: string | null;
          identity_verified_at: string | null;
        };
        Insert: {
          id?: string;
          email?: string | null;
          name?: string | null;
          phone?: string | null;
          country?: string | null;
          language?: string | null;
          created_at?: string;
          identity_status?: 'none' | 'pending' | 'verified' | 'rejected' | null;
          identity_doc_path?: string | null;
          identity_verified_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
        Relationships: [];
      };

      /* =========================== leads (CRM) =========================== */
      leads: {
        Row: {
          id: string;
          email: string | null;
          whatsapp: string | null;
          source: string | null;
          language: string | null;
          customer_id: string | null;
          stage: string;
          tags: string[];
          notes: string | null;
          visitor_id: string | null; // ✅ Ya incluido
          utm: Json | null;          // ✅ Ya incluido
          created_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          whatsapp?: string | null;
          source?: string | null;
          language?: string | null;
          customer_id?: string | null;
          stage?: string;
          tags?: string[];
          notes?: string | null;
          visitor_id?: string | null; // ✅ Ya incluido
          utm?: Json | null;          // ✅ Ya incluido
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['leads']['Insert']>;
        Relationships: [];
      };

      /* ======================= segments (CRM) =========================== */
      segments: {
        Row: {
          id: string;
          name: string;
          entity_type: string;
          filter: Json;
          description: string | null;
          last_run_at: string | null;
          last_run_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          entity_type: string;
          filter?: Json;
          description?: string | null;
          last_run_at?: string | null;
          last_run_count?: number | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['segments']['Insert']>;
        Relationships: [];
      };

      /* ======================= conversations (CRM) ======================== */
      conversations: {
        Row: {
          id: string;
          lead_id: string | null;
          customer_id: string | null;
          locale: string;
          channel: string;
          status: string;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          customer_id?: string | null;
          locale: string;
          channel: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
        Relationships: [];
      };

      /* ========================= messages (CRM) =========================== */
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          meta: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: string;
          content: string;
          meta?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
        Relationships: [];
      };

      /* ====================== crm_templates (CRM) ====================== */
      crm_templates: {
        Row: {
          id: string;
          key: string;
          locale: string;
          channel: string;
          variant: string;
          weight: number;
          weight_source: string;
          weight_updated_at: string | null;
          subject: string | null;
          body: string;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          locale?: string;
          channel?: string;
          variant?: string;
          weight?: number;
          weight_source?: string;
          weight_updated_at?: string | null;
          subject?: string | null;
          body: string;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['crm_templates']['Insert']>;
        Relationships: [];
      };

      /* ================= crm_outbound_messages (CRM outbound) ================= */
      crm_outbound_messages: {
        Row: {
          id: string;
          deal_id: string | null;
          ticket_id: string | null;
          lead_id: string | null;
          customer_id: string | null;
          channel: string;
          provider: string;
          status: string;
          to_email: string | null;
          to_phone: string | null;
          subject: string | null;
          body: string;
          template_key: string | null;
          template_variant: string | null;
          error: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          sent_at: string | null;
          outcome: string;
          replied_at: string | null;
          replied_note: string | null;
          attributed_won_at: string | null;
          attributed_booking_id: string | null;
        };
        Insert: {
          id?: string;
          deal_id?: string | null;
          ticket_id?: string | null;
          lead_id?: string | null;
          customer_id?: string | null;
          channel?: string;
          provider?: string;
          status?: string;
          to_email?: string | null;
          to_phone?: string | null;
          subject?: string | null;
          body?: string;
          template_key?: string | null;
          template_variant?: string | null;
          error?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          sent_at?: string | null;
          outcome?: string;
          replied_at?: string | null;
          replied_note?: string | null;
          attributed_won_at?: string | null;
          attributed_booking_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['crm_outbound_messages']['Insert']>;
        Relationships: [];
      };

      /* ================= crm_template_winner_locks (CRM optimization) ================= */
      crm_template_winner_locks: {
        Row: {
          id: string;
          key: string;
          locale: string;
          channel: string;
          cohort: string;
          winner_variant: string;
          sample_sent: number;
          paid_rate: number;
          computed_at: string;
          lock_until: string;
          meta: Json;
        };
        Insert: {
          id?: string;
          key: string;
          locale: string;
          channel: string;
          cohort: string;
          winner_variant: string;
          sample_sent?: number;
          paid_rate?: number;
          computed_at?: string;
          lock_until: string;
          meta?: Json;
        };
        Update: Partial<Database['public']['Tables']['crm_template_winner_locks']['Insert']>;
        Relationships: [];
      };

      /* ======================= tickets (support) ======================= */
      tickets: {
        Row: {
          id: string;
          lead_id: string | null;
          customer_id: string | null;
          conversation_id: string | null;
          subject: string | null;
          summary: string | null;
          status: string | null;
          priority: string | null;
          channel: string | null;
          assigned_to: string | null;
          last_message_at: string | null;
          created_at: string | null;
          updated_at: string | null;
          closed_at: string | null;
          resolved_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['tickets']['Row']>;
        Update: Partial<Database['public']['Tables']['tickets']['Row']>;
        Relationships: [];
      };

      /* ======================= preferences (CRM) ========================== */
      preferences: {
        Row: {
          id: string;
          owner_type: string;
          owner_id: string;
          interests: Json | null;
          budget_range: Json | null;
          cities: string[];
          travel_dates: Json | null;
          pax: number | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['preferences']['Row']>;
        Update: Partial<Database['public']['Tables']['preferences']['Row']>;
        Relationships: [];
      };

      /* ========================= user_roles (admin) ======================= */
      user_roles: {
        Row: {
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_roles']['Insert']>;
        Relationships: [];
      };

      /* ========================= tours ======================== */
      tours: {
        Row: {
          id: string;
          slug: string;
          title: string;
          summary: string;
          body_md: string | null;
          city: string;
          duration_hours: number;
          base_price: number;
          images: Json;
          tags: string[];
          is_featured: boolean;
          rating: number;
          search_tsv: unknown | null;
          view_count: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['tours']['Row']>;
        Update: Partial<Database['public']['Tables']['tours']['Row']>;
        Relationships: [];
      };

      /* ======================= reviews ======================== */
      reviews: {
        Row: {
          id: string;
          tour_id: string | null;
          tour_slug: string | null;
          user_id: string | null;
          rating: number; // 1..5
          comment: string | null;
          title: string | null;
          body: string | null;
          customer_name: string | null;
          customer_email: string | null;
          avatar_url: string | null;
          media_urls: string[] | null;
          face_consent: boolean | null;
          status: ReviewStatus | null;
          published_at: string | null;
          verified_booking_id: string | null;
          approved: boolean | null; // legacy
          honeypot: string | null;
          ip: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['reviews']['Row']>;
        Update: Partial<Database['public']['Tables']['reviews']['Row']>;
        Relationships: [];
      };

      /* ============== tour_availability (opcional) ============== */
      tour_availability: {
        Row: {
          tour_id: string;
          date: string;
          price: number | null;
          capacity: number | null;
          created_at: string | null;
          source: string | null;
          entity_id: string | null;
          dedupe_key: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['tour_availability']['Row']>;
        Update: Partial<Database['public']['Tables']['tour_availability']['Row']>;
        Relationships: [];
      };

      /* ========================= posts (content) ========================== */
      posts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          content_md: string;
          cover_url: string | null;
          tags: string[];
          lang: string;
          status: string;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['posts']['Row']>;
        Update: Partial<Database['public']['Tables']['posts']['Row']>;
        Relationships: [];
      };

      /* ========================= videos (content) ========================= */
      videos: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          youtube_url: string;
          cover_url: string | null;
          tags: string[];
          lang: string;
          status: string;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['videos']['Row']>;
        Update: Partial<Database['public']['Tables']['videos']['Row']>;
        Relationships: [];
      };

      /* ========================= newsletter_subscriptions ========================= */
      newsletter_subscriptions: {
        Row: {
          id: string;
          email: string;
          status: string;
          confirm_token_hash: string | null;
          unsubscribe_token_hash: string | null;
          visitor_id: string | null;
          source: string | null;
          utm: Json | null;
          token_sent_at: string | null;
          confirmed_at: string | null;
          unsubscribed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['newsletter_subscriptions']['Row']>;
        Update: Partial<Database['public']['Tables']['newsletter_subscriptions']['Row']>;
        Relationships: [];
      };

      /* ========================= wishlists ========================= */
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['wishlists']['Row']>;
        Update: Partial<Database['public']['Tables']['wishlists']['Row']>;
        Relationships: [];
      };

      /* ========================= wishlist_items ========================= */
      wishlist_items: {
        Row: {
          id: string;
          wishlist_id: string;
          tour_id: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['wishlist_items']['Row']>;
        Update: Partial<Database['public']['Tables']['wishlist_items']['Row']>;
        Relationships: [];
      };

      /* ========================= deals (CRM) ========================= */
      deals: {
        Row: {
          id: string;
          lead_id: string | null;
          customer_id: string | null;
          tour_slug: string | null;
          checkout_url: string | null;
          stripe_session_id: string | null;
          title: string;
          stage: string;
          amount_minor: number | null;
          currency: string | null;
          probability: number | null;
          assigned_to: string | null;
          source: string | null;
          notes: string | null;
          landing_path: string | null;
          landing_at: string | null;
          first_cta: string | null;
          first_cta_page: string | null;
          first_cta_at: string | null;
          last_cta: string | null;
          last_cta_page: string | null;
          last_cta_at: string | null;
          created_at: string | null;
          updated_at: string | null;
          closed_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['deals']['Row']>;
        Update: Partial<Database['public']['Tables']['deals']['Row']>;
        Relationships: [];
      };

      /* ========================= deal_notes (CRM) ========================= */
      deal_notes: {
        Row: {
          id: string;
          deal_id: string;
          body: string;
          created_by: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['deal_notes']['Row']>;
        Update: Partial<Database['public']['Tables']['deal_notes']['Row']>;
        Relationships: [];
      };

      /* ========================= tasks (CRM) ========================= */
      tasks: {
        Row: {
          id: string;
          deal_id: string | null;
          ticket_id: string | null;
          title: string;
          status: string;
          priority: string;
          assigned_to: string | null;
          due_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['tasks']['Row']>;
        Update: Partial<Database['public']['Tables']['tasks']['Row']>;
        Relationships: [];
      };

      /* ================= Runtime/Admin/Ops tables (loose typing) ================= */
      action_nonces: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      admin_audit_events: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      affiliate_clicks: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      affiliates: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      ai_playbook_snippets: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      consent_events: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      crm_alert_rules: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      crm_alerts: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      crm_audit_log: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      crm_breakglass_requests: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      crm_breakglass_tokens: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      crm_channel_pauses: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      crm_followup_locks: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      crm_incentives: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      crm_mitigation_actions: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      crm_ops_approvals: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      crm_outbound_events: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      crm_role_bindings: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      crm_roles: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      crm_runtime_flags: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      crm_sequence_enrollments: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      crm_sequence_steps: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      crm_sequences: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      growth_launches: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      marketing_spend_daily: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      ops_backups_log: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      ops_dr_drills: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      ops_incident_updates: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      ops_incidents: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      ops_postmortems: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      privacy_requests: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      review_avatars: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      security_events: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      tour_pricing_rules: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      user_consents: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      user_events: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
      web_vitals: { Row: LooseRow; Insert: LooseInsert; Update: LooseUpdate; Relationships: [] };
    };

    Views: Record<string, never>;
    Functions: {
      increment_tour_view: {
        Args: { p_slug: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/* =================== Helpers de conveniencia =================== */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Enums<T extends keyof Database['public']['Enums'] = never> = T extends never
  ? never
  : Database['public']['Enums'][T];