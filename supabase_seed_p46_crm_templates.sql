-- supabase_seed_p46_crm_templates.sql
-- Optional: default templates (ES/EN/DE). Upserts by (key, locale, channel).

-- NOTE: Uses INSERT .. ON CONFLICT on unique index (key, locale, channel).

insert into public.crm_templates (key, locale, channel, subject, body, enabled)
values
  -- ========== WhatsApp (ES) ==========
  ('deal.followup.new','es','whatsapp',null,
   'Hola {name} 👋 Soy del equipo KCE. Vi tu interés en {tour}. ¿Qué fecha te gustaría y cuántas personas serían?\n\nPuedo enviarte la propuesta y, si ya está listo, el link de pago.','true'),
  ('deal.followup.contacted','es','whatsapp',null,
   'Hola {name} 👋 ¿Cómo vas? Te escribo para confirmar si seguimos con {tour} el {date} para {people} persona(s). Si quieres, te dejo el link de pago aquí: {checkout_url}','true'),
  ('deal.followup.qualified','es','whatsapp',null,
   'Perfecto {name} 🙌 Con lo que me dijiste, te preparo propuesta para {tour} (fecha {date}, {people} persona(s)). ¿Alguna preferencia especial?','true'),
  ('deal.followup.proposal','es','whatsapp',null,
   'Hola {name} 👋 Te acabo de enviar la propuesta de {tour}. ¿La pudiste revisar? Si quieres, te paso el link de pago para reservar: {checkout_url}','true'),
  ('deal.followup.checkout','es','whatsapp',null,
   'Hola {name} 🙌 Te comparto el link de pago para confirmar tu reserva de {tour}: {checkout_url}\n\nCuando pagues, te llega confirmación + factura.','true'),

  -- ========== Email (ES) ==========
  ('deal.followup.checkout','es','email','Reserva {tour} - Link de pago',
   'Hola {name},\n\nAquí tienes tu link de pago para confirmar la reserva de {tour} el {date} para {people} persona(s):\n{checkout_url}\n\nAl completar el pago recibirás la confirmación, factura y detalles del tour.\n\nEquipo KCE','true'),

  -- ========== WhatsApp (EN) ==========
  ('deal.followup.new','en','whatsapp',null,
   'Hi {name} 👋 This is KCE team. I saw your interest in {tour}. What date would you like and how many people?\n\nI can send you the proposal and, if you are ready, the payment link.','true'),
  ('deal.followup.checkout','en','whatsapp',null,
   'Hi {name} 🙌 Here is the payment link to confirm your booking for {tour}: {checkout_url}\n\nAfter payment you will receive confirmation + invoice.','true'),

  -- ========== WhatsApp (DE) ==========
  ('deal.followup.new','de','whatsapp',null,
   'Hallo {name} 👋 Hier ist das KCE-Team. Ich habe dein Interesse an {tour} gesehen. Für welches Datum und wie viele Personen?\n\nIch kann dir das Angebot schicken und – wenn du bereit bist – den Zahlungslink.','true'),
  ('deal.followup.checkout','de','whatsapp',null,
   'Hallo {name} 🙌 Hier ist der Zahlungslink, um deine Buchung für {tour} zu bestätigen: {checkout_url}\n\nNach der Zahlung bekommst du Bestätigung + Rechnung.','true')

on conflict (key, locale, channel)
do update set
  subject = excluded.subject,
  body = excluded.body,
  enabled = excluded.enabled,
  updated_at = now();


-- ========== Tickets (ANY channel) ==========
insert into public.crm_templates (key, locale, channel, subject, body, enabled)
values
  ('ticket.first_reply','es','any',null,
   'Hola {name},\n\nGracias por escribirnos. Para ayudarte rápido, confírmame por favor: 1) fecha, 2) número de personas, 3) ciudad/tour que te interesa.\n\n— KCE | Knowing Cultures Enterprise', true),
  ('ticket.followup_24h','es','any',null,
   'Hola {name} 😊\n\nSolo para hacer seguimiento. ¿Quieres que te envíe una propuesta con precios y disponibilidad?\n\n— KCE | Knowing Cultures Enterprise', true),
  ('ticket.proposal_sent','es','any',null,
   'Hola {name},\n\nTe envié la propuesta. Si te gusta, aquí tienes el link seguro de pago: {checkout_url}\n\n— KCE | Knowing Cultures Enterprise', true),
  ('ticket.checkout','es','any',null,
   'Hola {name},\n\n¿Listo para confirmar? Link seguro de pago: {checkout_url}\n\nAl pagar, recibes factura y evento de calendario.\n\n— KCE | Knowing Cultures Enterprise', true),
  ('ticket.closing','es','any',null,
   'Hola {name},\n\nPor nuestra parte todo listo. Si necesitas algo más, responde por aquí cuando quieras.\n\n— KCE | Knowing Cultures Enterprise', true)

on conflict (key, locale, channel)
do update set
  subject = excluded.subject,
  body = excluded.body,
  enabled = excluded.enabled,
  updated_at = now();
