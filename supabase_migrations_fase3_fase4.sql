-- ================================================================
-- KCE — Migraciones Fase 3 (Multi-día + Combos) y Fase 4 (2FA + ID)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ================================================================

-- ----------------------------------------------------------------
-- FASE 3: Motor de Reservas V2
-- ----------------------------------------------------------------

-- 3.1 Agregar campos de rango de fechas a bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date   date;

-- Migrar datos existentes: date → start_date + end_date
UPDATE public.bookings
SET
  start_date = date,
  end_date   = date
WHERE start_date IS NULL;

-- Índice para consultas por rango
CREATE INDEX IF NOT EXISTS idx_bookings_date_range
  ON public.bookings(start_date, end_date);

-- 3.2 Tabla booking_items (relación muchos a muchos: combo de tours)
CREATE TABLE IF NOT EXISTS public.booking_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid        NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  tour_id       uuid        REFERENCES public.tours(id) ON DELETE SET NULL,
  tour_slug     text,
  tour_date     date        NOT NULL,
  persons       int         NOT NULL DEFAULT 1 CHECK (persons > 0),
  price_minor   integer     NOT NULL CHECK (price_minor >= 0),
  currency      text        NOT NULL DEFAULT 'EUR' CHECK (char_length(currency) = 3),
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_items_booking_id
  ON public.booking_items(booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_items_tour_id
  ON public.booking_items(tour_id);

-- Trigger updated_at en bookings ya existe; agregar en booking_items
DROP TRIGGER IF EXISTS trg_booking_items_updated ON public.booking_items;

-- RLS: booking_items sigue la misma política que bookings (service_role)
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'booking_items'
  ) THEN
    CREATE POLICY booking_items_deny_all ON public.booking_items
      AS RESTRICTIVE FOR ALL
      USING (false);
  END IF;
END $$;

-- 3.3 Columna de descuento en bookings (para registrar el combo discount)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS combo_discount_minor integer DEFAULT 0;

-- ----------------------------------------------------------------
-- FASE 4: Seguridad — Verificación de Identidad
-- ----------------------------------------------------------------

-- 4.1 Columnas de verificación de identidad en customers
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS identity_status text
    CHECK (identity_status IN ('none', 'pending', 'verified', 'rejected'))
    DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS identity_doc_path    text,
  ADD COLUMN IF NOT EXISTS identity_verified_at timestamptz;

-- 4.2 Índice para filtrar clientes pendientes de verificación
CREATE INDEX IF NOT EXISTS idx_customers_identity_status
  ON public.customers(identity_status)
  WHERE identity_status IN ('pending', 'rejected');

-- ----------------------------------------------------------------
-- FASE 4: Storage — Bucket identity_vault + RLS
-- ----------------------------------------------------------------
-- NOTA: Crea el bucket manualmente en Supabase Dashboard:
--   Storage → New bucket → Nombre: "identity_vault" → Private ✓
-- Luego ejecuta las políticas de abajo.

-- Política RLS para identity_vault:
-- Solo el dueño del archivo (carpeta = user_id) puede leer/escribir.
DROP POLICY IF EXISTS identity_vault_owner_all ON storage.objects;

CREATE POLICY identity_vault_owner_all ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'identity_vault'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'identity_vault'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política adicional: admins (service_role) pueden leer todos los documentos
-- (Esto se gestiona desde el backend con service_role key, sin política extra necesaria)

-- ----------------------------------------------------------------
-- Verificación final
-- ----------------------------------------------------------------
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('bookings', 'customers', 'booking_items')
  AND column_name IN (
    'start_date', 'end_date', 'combo_discount_minor',
    'identity_status', 'identity_doc_path', 'identity_verified_at'
  )
ORDER BY table_name, column_name;
