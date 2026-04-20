-- ============================================================
-- KCE — Seed oficial: 3 tours premium Bogotá
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Eliminar tours de demo/mock anteriores y dejar solo los 3 oficiales
DELETE FROM public.tours
WHERE slug NOT IN (
  'cima-al-origen-bogota',
  'sabores-autenticos-bogota',
  'bogota-sobre-ruedas'
);

-- UPSERT Tour 1: De la Cima al Origen
INSERT INTO public.tours (
  slug, title, city, tags,
  base_price, duration_hours,
  images, summary, body_md,
  rating, view_count, is_featured
) VALUES (
  'cima-al-origen-bogota',
  'De la Cima al Origen: Monserrate + Centro Histórico',
  'Bogotá',
  ARRAY['historia', 'cultura', 'walking-tour', 'iconico'],
  6000,   -- ~60 EUR por persona (135 USD/pareja a ~4500 COP/EUR)
  5.0,
  '[
    {"url": "/images/tours/bogota-monserrate.jpg", "alt": "Santuario de Monserrate al amanecer"},
    {"url": "/images/tours/bogota-candelaria.jpg", "alt": "Calles coloniales de La Candelaria"},
    {"url": "/images/tours/bogota-bolivar.jpg",    "alt": "Plaza de Bolívar"}
  ]'::jsonb,
  'Desde las nubes de Monserrate hasta las calles más antiguas de La Candelaria. Geografía, historia y cultura colombiana en 5 horas.',
  E'## El tour\n\nComenzamos donde Bogotá se ve entera: el cerro de Monserrate. Desde 3.152 m de altitud entendemos cómo se fundó esta ciudad y hacia dónde creció.\n\nLuego bajamos y caminamos sus calles más antiguas.\n\n### Itinerario\n\n**Monserrate** (teleférico o funicular)\n- Mirador y contexto geográfico de Bogotá\n- Historia de la fundación española (1538)\n- Santuario y devoción popular\n\n**La Candelaria**\n- Callejuelas coloniales y arquitectura republicana\n- Museo Botero (fachada y contexto)\n- Plaza de Bolívar: Capitolio, Palacio de Justicia, Catedral Primada\n\n**Chorro de Quevedo**\n- Origen tradicional de la ciudad\n- Arte urbano y vida bohemia\n- Cierre con recomendaciones personalizadas\n\n### Incluye\n- Guía experto bilingüe (español/inglés)\n- Teleférico o funicular Monserrate (ida y vuelta)\n- Soporte por WhatsApp antes y después\n- Confirmación de booking + factura digital\n\n### No incluye\n- Entradas a museos (opcionales)\n- Transporte al punto de encuentro\n- Propinas\n\n### Punto de encuentro\nBase del teleférico de Monserrate — ubicación exacta enviada tras reserva',
  5.0,
  0,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title          = EXCLUDED.title,
  city           = EXCLUDED.city,
  tags           = EXCLUDED.tags,
  base_price     = EXCLUDED.base_price,
  duration_hours = EXCLUDED.duration_hours,
  images         = EXCLUDED.images,
  summary        = EXCLUDED.summary,
  body_md        = EXCLUDED.body_md,
  is_featured    = EXCLUDED.is_featured;

-- UPSERT Tour 2: Sabores Auténticos
INSERT INTO public.tours (
  slug, title, city, tags,
  base_price, duration_hours,
  images, summary, body_md,
  rating, view_count, is_featured
) VALUES (
  'sabores-autenticos-bogota',
  'Sabores Auténticos de Colombia',
  'Bogotá',
  ARRAY['gastronomia', 'cultura', 'food-tour', 'mercado'],
  3900,   -- ~39 EUR por persona (87 USD/pareja)
  3.0,
  '[
    {"url": "/images/tours/bogota-paloquemao.jpg",  "alt": "Plaza de Paloquemao"},
    {"url": "/images/tours/bogota-ajiaco.jpg",       "alt": "Ajiaco bogotano tradicional"},
    {"url": "/images/tours/bogota-cafe.jpg",         "alt": "Café de especialidad colombiano"}
  ]'::jsonb,
  'Paloquemao, frutas exóticas, ajiaco y café de origen. Una inmersión en la cocina colombiana más allá de los restaurantes.',
  E'## El tour\n\nLa gastronomía colombiana es diversa, regional y profundamente cultural. Este recorrido te lleva a los mercados y mesas donde se vive de verdad.\n\n### Itinerario\n\n**Plaza de Paloquemao**\n- Mercado popular más grande de Bogotá\n- Degustación de frutas exóticas: lulo, maracuyá, feijoa, pitahaya\n- Historia del abastecimiento urbano bogotano\n\n**Experiencia gastronómica central**\n- Changua (desayuno bogotano tradicional) o Ajiaco según horario\n- Explicación de ingredientes regionales: papa criolla, guasca, mazorca\n- Cultura culinaria y recetas familiares\n\n**Cierre cafetero**\n- Café de especialidad de origen colombiano\n- Diferencias por región (Huila, Nariño, Antioquia)\n- Recomendaciones de tiendas y restaurantes locales\n\n### Incluye\n- Guía experto bilingüe (español/inglés)\n- 3 degustaciones incluidas\n- Café de especialidad\n- Soporte por WhatsApp antes y después\n- Confirmación de booking + factura digital\n\n### No incluye\n- Comidas adicionales\n- Transporte al punto de encuentro\n- Propinas\n\n### Punto de encuentro\nPlaza de Paloquemao — ubicación exacta enviada tras reserva',
  5.0,
  0,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title          = EXCLUDED.title,
  city           = EXCLUDED.city,
  tags           = EXCLUDED.tags,
  base_price     = EXCLUDED.base_price,
  duration_hours = EXCLUDED.duration_hours,
  images         = EXCLUDED.images,
  summary        = EXCLUDED.summary,
  body_md        = EXCLUDED.body_md,
  is_featured    = EXCLUDED.is_featured;

-- UPSERT Tour 3: Bogotá sobre Ruedas
INSERT INTO public.tours (
  slug, title, city, tags,
  base_price, duration_hours,
  images, summary, body_md,
  rating, view_count, is_featured
) VALUES (
  'bogota-sobre-ruedas',
  'Bogotá sobre Ruedas: Ciclismo y Arte Urbano',
  'Bogotá',
  ARRAY['ciclovía', 'arte-urbano', 'aventura', 'bike-tour'],
  5300,   -- ~53 EUR por persona (120 USD/pareja)
  3.5,
  '[
    {"url": "/images/tours/bogota-cicla.jpg",        "alt": "Ciclismo urbano en Bogotá"},
    {"url": "/images/tours/bogota-graffiti.jpg",     "alt": "Murales Calle 26"},
    {"url": "/images/tours/bogota-parkway.jpg",      "alt": "Park Way bogotano"}
  ]'::jsonb,
  'Pedaleamos por La Concordia, los murales de la Calle 26 y Park Way. Graffiti, protesta social y cultura popular desde la bicicleta. Bici y casco incluidos.',
  E'## El tour\n\nBogotá tiene más de 550 km de ciclorrutas. Este recorrido te muestra la ciudad desde el nivel de la calle, entre arte, historia y barrios auténticos.\n\n### Itinerario\n\n**La Concordia y La Candelaria**\n- Arte urbano y murales comunitarios\n- Historia del graffiti como expresión política en Colombia\n- Barrios bohemios y vida estudiantil\n\n**Avenida El Dorado (Calle 26)**\n- Corredor de murales más largo de Bogotá\n- Arte de clase mundial en espacio público\n- Contexto social y político de cada obra\n\n**Park Way**\n- Cicloruta arborizada del barrio La Soledad\n- Cafés locales y cultura de barrio\n- Cierre y conversación sobre Bogotá contemporánea\n\n### Incluye\n- Bicicleta por toda la duración del tour\n- Casco de seguridad\n- Guía experto bilingüe (español/inglés)\n- Snack energético a mitad de recorrido\n- Soporte por WhatsApp antes y después\n- Confirmación de booking + factura digital\n\n### No incluye\n- Transporte al punto de encuentro\n- Gastos personales\n- Propinas\n\n### Punto de encuentro\nLa Candelaria — ubicación exacta enviada tras reserva',
  5.0,
  0,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title          = EXCLUDED.title,
  city           = EXCLUDED.city,
  tags           = EXCLUDED.tags,
  base_price     = EXCLUDED.base_price,
  duration_hours = EXCLUDED.duration_hours,
  images         = EXCLUDED.images,
  summary        = EXCLUDED.summary,
  body_md        = EXCLUDED.body_md,
  is_featured    = EXCLUDED.is_featured;

-- Verificar resultado
SELECT slug, title, base_price, duration_hours, is_featured
FROM public.tours
ORDER BY is_featured DESC, base_price ASC;
