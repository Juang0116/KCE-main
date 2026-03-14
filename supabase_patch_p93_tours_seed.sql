-- supabase_patch_p93_tours_seed.sql
-- Seeds 6 core KCE tours. Safe to run multiple times (ON CONFLICT DO UPDATE).

insert into public.tours (
  slug, title, city, duration_hours, base_price, summary, body_md,
  tags, is_featured, rating, images
) values
(
  'bogota-coffee-culture', 'Bogotá Coffee Culture', 'Bogotá',
  4, 4900,
  'Cata de cafés especiales, tostión artesanal y barrios bohemios.',
  E'Descubre la revolución del café colombiano de tercera ola. Visitamos tres tostadoras artesanales de Bogotá, aprendemos a identificar perfiles de sabor y recorremos La Candelaria y Chapinero.\n\n**Incluye:** guía experto, 3 degustaciones, transporte entre puntos.\n**No incluye:** transporte desde/hacia tu alojamiento.\n**Punto de encuentro:** Plaza de Bolívar, La Candelaria.',
  ARRAY['coffee', 'culture', 'walking', 'food'],
  true, 4.8,
  '{"main": "/images/tours/bogota-coffee.jpg"}'::jsonb
),
(
  'medellin-street-art', 'Medellín Street Art & Transformation', 'Medellín',
  3, 3500,
  'Arte urbano, historia y la transformación más asombrosa de Colombia.',
  E'Medellín pasó de ciudad más peligrosa del mundo a referente global de urbanismo. Este tour recorre los murales de La Candelaria, visita el metrocable y explica el rol del arte en esa transformación.\n\n**Incluye:** guía local, metrocable, acceso a miradores.\n**Punto de encuentro:** Estación Cisneros del Metro.',
  ARRAY['art', 'culture', 'history', 'walking'],
  true, 4.7,
  '{"main": "/images/tours/medellin.jpg"}'::jsonb
),
(
  'guatape-day-trip', 'Guatapé & La Piedra del Peñol', 'Guatapé',
  10, 8900,
  'La roca más famosa de Colombia y el pueblo más colorido del país.',
  E'Un día completo desde Medellín: subimos los 740 escalones de La Piedra del Peñol, almorzamos trucha fresca y recorremos las calles coloridas de Guatapé.\n\n**Incluye:** transporte Medellín–Guatapé, guía, entrada a la Piedra, almuerzo.\n**Salida:** 7am desde Medellín.',
  ARRAY['nature', 'adventure', 'day-trip', 'culture'],
  true, 4.9,
  '{"main": "/images/tours/guatape.jpg"}'::jsonb
),
(
  'cartagena-sunset-sail', 'Cartagena Sunset Sailing', 'Cartagena',
  3, 5900,
  'Velero por la bahía de Cartagena mientras el sol se pone sobre las murallas.',
  E'Navega por la bahía histórica de Cartagena a bordo de un velero. Pasamos frente a las murallas coloniales y el fuerte de San Fernando mientras disfrutamos cócteles y el atardecer caribeño.\n\n**Incluye:** velero privado, bebidas, guía.\n**Salida:** 4:30pm desde el Muelle de la Bodeguita.',
  ARRAY['sailing', 'sunset', 'romantic', 'culture'],
  false, 4.8,
  '{"main": "/images/tours/cartagena-sunset.jpg"}'::jsonb
),
(
  'cocora-valley-hike', 'Cocora Valley & Wax Palms', 'Salento',
  8, 6900,
  'Las palmas de cera más altas del mundo en el corazón del eje cafetero.',
  E'El Valle de Cocora alberga las palmas de cera más altas del planeta — el árbol nacional de Colombia. Trekking de día completo combinando bosque nublado, cascadas y la vista más icónica del Eje Cafetero.\n\n**Incluye:** guía de senderismo, transporte local, seguro básico.\n**Dificultad:** media (8km de caminata).',
  ARRAY['hiking', 'nature', 'coffee', 'adventure'],
  true, 4.9,
  '{"main": "/images/tours/cocora.jpg"}'::jsonb
),
(
  'tayrona-paradise-beaches', 'Tayrona National Park & Beaches', 'Santa Marta',
  9, 9500,
  'Las playas más salvajes del Caribe colombiano dentro de un parque nacional.',
  E'El Parque Nacional Tayrona protege uno de los ecosistemas costeros más biodiversos del mundo. Caminamos por senderos selváticos hasta playas vírgenes y aprendemos sobre la cultura de los pueblos Kogui.\n\n**Incluye:** transporte, entrada al parque, guía naturalista.\n**Punto de salida:** Santa Marta, 7am.',
  ARRAY['beach', 'nature', 'hiking', 'culture'],
  false, 4.7,
  '{"main": "/images/tours/tayrona.jpg"}'::jsonb
)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  body_md = excluded.body_md,
  base_price = excluded.base_price,
  rating = excluded.rating,
  tags = excluded.tags,
  is_featured = excluded.is_featured,
  images = excluded.images,
  updated_at = now();
