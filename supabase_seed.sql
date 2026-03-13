-- KCE 3.0 — Seed demo tours (idempotente)
-- Ejecuta esto DESPUÉS de supabase_schema.sql

insert into public.tours
  (slug, title, city, summary, base_price, duration_hours, tags, images, rating, is_featured)
values
  (
    'bogota-cultural-coffee',
    'Bogotá Cultural & Coffee',
    'Bogotá',
    'Recorre el centro histórico, prueba café de especialidad y vive Bogotá como un local.',
    4900,
    4,
    array['cultura','gastronomía','café'],
    jsonb_build_array(jsonb_build_object('url','/images/hero-kce.jpg','alt','Bogotá Cultural & Coffee')),
    4.8,
    true
  ),
  (
    'cartagena-street-food',
    'Cartagena Street Food',
    'Cartagena',
    'Sabores caribeños, plazas, palenqueras y la mejor ruta de comida callejera.',
    5900,
    3,
    array['gastronomía','caribe','cultura'],
    jsonb_build_array(jsonb_build_object('url','/images/hero-kce.jpg','alt','Cartagena Street Food')),
    4.7,
    true
  ),
  (
    'eje-cafetero-finca-experience',
    'Eje Cafetero: Experiencia en Finca',
    'Caldas',
    'Vive el proceso del café en una finca, cata guiada y paisaje cafetero.',
    7900,
    6,
    array['café','naturaleza','cultura'],
    jsonb_build_array(jsonb_build_object('url','/images/hero-kce.jpg','alt','Eje Cafetero Finca')),
    4.9,
    true
  ),
  (
    'tayrona-nature-day',
    'Tayrona Nature Day',
    'Santa Marta',
    'Senderismo, playa y naturaleza en un día inolvidable cerca del Parque Tayrona.',
    8900,
    8,
    array['naturaleza','aventura','playa'],
    jsonb_build_array(jsonb_build_object('url','/images/hero-kce.jpg','alt','Tayrona Nature Day')),
    4.6,
    false
  ),
  (
    'guatavita-legend-lake',
    'Guatavita: Lago y Leyenda',
    'Cundinamarca',
    'Descubre el lago sagrado, la historia muisca y miradores espectaculares.',
    5500,
    5,
    array['historia','naturaleza','cultura'],
    jsonb_build_array(jsonb_build_object('url','/images/hero-kce.jpg','alt','Guatavita')),
    4.5,
    false
  ),
  (
    'medellin-innovation-comuna13',
    'Medellín: Innovación & Comuna 13',
    'Medellín',
    'Arte urbano, transformación social y puntos icónicos de la ciudad.',
    6500,
    4,
    array['cultura','historia','ciudad'],
    jsonb_build_array(jsonb_build_object('url','/images/hero-kce.jpg','alt','Medellín Comuna 13')),
    4.8,
    true
  )
on conflict (slug) do update set
  title = excluded.title,
  city = excluded.city,
  summary = excluded.summary,
  base_price = excluded.base_price,
  duration_hours = excluded.duration_hours,
  tags = excluded.tags,
  images = excluded.images,
  rating = excluded.rating,
  is_featured = excluded.is_featured;
