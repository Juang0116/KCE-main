-- supabase_patch_p65_ops_templates_seed.sql
-- Seed ops templates (booking support/cancel/reschedule/refund) for email/whatsapp.
-- Requires: supabase_patch_p46_crm_templates.sql + supabase_patch_p48_crm_templates_variants.sql
-- Safe to run multiple times.

begin;

with seed(key, locale, channel, variant, weight, subject, body) as (
  values
    -- WhatsApp (ES)
    ('booking.ops.ack_cancel','es','whatsapp','A',1,null,
     'Hola {name} 👋 Recibimos tu solicitud de *cancelación* para la reserva {booking_id} ({tour}).

En máximo 2–4 horas te confirmamos el estado y los pasos (reembolso o voucher, según aplique).

Si quieres dejar más detalles, responde a este mensaje o escríbenos desde tu cuenta: {support_url}'
    ),
    ('booking.ops.ack_reschedule','es','whatsapp','A',1,null,
     'Hola {name} 👋 Recibimos tu solicitud de *cambio de fecha* para la reserva {booking_id} ({tour}).

Confírmanos la nueva fecha deseada y cuántas personas, y te respondemos con opciones.

Soporte: {support_url}'
    ),
    ('booking.ops.refund_received','es','whatsapp','A',1,null,
     'Hola {name} ✅ Registramos tu solicitud de reembolso para {booking_id}.

Te avisaremos cuando quede procesado (depende del banco, suele tardar 5–10 días hábiles).

Ticket/Soporte: {support_url}'
    ),

    -- Email (ES)
    ('booking.ops.ack_cancel','es','email','A',1,'Solicitud de cancelación recibida — {tour}',
     'Hola {name},

Recibimos tu solicitud de cancelación para la reserva {booking_id} ({tour}) con fecha {booking_date}.

Nuestro equipo de operaciones te confirmará el estado y los pasos en un plazo aproximado de 2–4 horas (reembolso o voucher, según aplique).

Si necesitas agregar información (motivo, cambios, etc.), responde a este correo o escribe desde tu cuenta: {support_url}

Gracias,
Equipo KCE'
    ),
    ('booking.ops.ack_reschedule','es','email','A',1,'Solicitud de cambio de fecha — {tour}',
     'Hola {name},

Recibimos tu solicitud de cambio de fecha para la reserva {booking_id} ({tour}).

Por favor indícanos la nueva fecha deseada y número de personas para confirmarte disponibilidad y ajuste de precio si aplica.

Soporte: {support_url}

Gracias,
Equipo KCE'
    ),
    ('booking.ops.refund_received','es','email','A',1,'Solicitud de reembolso registrada — {tour}',
     'Hola {name},

Registramos tu solicitud de reembolso para la reserva {booking_id} ({tour}).

Te avisaremos cuando el reembolso quede procesado. Dependiendo del banco, puede tardar entre 5 y 10 días hábiles en reflejarse.

Soporte: {support_url}

Gracias,
Equipo KCE'
    )
)
insert into public.crm_templates (key, locale, channel, variant, weight, subject, body, enabled)
select s.key, s.locale, s.channel, s.variant, s.weight, s.subject, s.body, true
from seed s
where not exists (
  select 1 from public.crm_templates t
  where t.key = s.key and t.locale = s.locale and t.channel = s.channel and t.variant = s.variant
);

commit;
