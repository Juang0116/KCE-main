-- supabase_patch_p91_followup_sequences_seed.sql
-- Seeds the KCE plan follow-up sequence in crm_sequences.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).

-- 1. Insert sequence
insert into public.crm_sequences (
  key, name, status, channel, locale, description, entry_event
) values (
  'kce.plan.no_response.v1',
  'Plan personalizado — sin respuesta',
  'active',
  'email',
  'es',
  'Drip de 3 pasos (2h, 24h, 72h) para leads que enviaron el formulario de plan pero no reservaron.',
  'quiz.crm_routed'
)
on conflict (key) do nothing;

-- 2. Insert steps (only if sequence was just created — safe by unique constraint)
do $$
declare
  seq_id uuid;
begin
  select id into seq_id from public.crm_sequences where key = 'kce.plan.no_response.v1';
  if seq_id is null then return; end if;

  insert into public.crm_sequence_steps (
    sequence_id, step_index, delay_minutes, channel, subject, body, metadata
  ) values
  (
    seq_id, 0, 120, 'email',
    'Tu plan de viaje KCE está listo 🗺️',
    E'Hola {name} 👋\n\nHace un momento pediste tu plan personalizado para {city} con KCE.\n\nResumen:\n- Ciudad: {city}\n- Presupuesto: {budget}\n- Intereses: {interests}\n\n¿Tienes dudas o quieres ajustar fechas? Responde este correo y te ayudamos en menos de 12 horas.\n\n→ Ver catálogo: {tours_url}\n\nEquipo KCE',
    '{}'::jsonb
  ),
  (
    seq_id, 1, 1440, 'email',
    'Tu itinerario KCE sigue disponible ✈️',
    E'Hola {name},\n\nVimos que aún no has confirmado tu viaje a {city}.\n\nSi tienes preguntas sobre tours, precios o fechas, responde este correo o visita:\n→ {contact_url}\n\nTambién puedes explorar más en:\n→ {tours_url}\n\nEquipo KCE',
    '{}'::jsonb
  ),
  (
    seq_id, 2, 4320, 'email',
    '¿Seguimos con tu plan de Colombia? 🌿',
    E'Hola {name},\n\nEste es nuestro último seguimiento sobre tu plan a {city}.\n\nSi ya decidiste no viajar por ahora, sin problema — vuelve cuando quieras.\n\nSi aún tienes interés:\n→ Agendar llamada de 15 min: {contact_url}\n→ Ver tours: {tours_url}\n\nEquipo KCE',
    '{}'::jsonb
  )
  on conflict (sequence_id, step_index) do nothing;
end $$;
