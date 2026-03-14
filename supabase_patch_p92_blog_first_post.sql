-- supabase_patch_p92_blog_first_post.sql
-- Seeds the first blog post for KCE. Safe to run multiple times (ON CONFLICT DO NOTHING).

insert into public.posts (
  slug, title, excerpt, content_md, cover_url, tags, lang, status, published_at
) values (
  'guia-bogota-turismo-cultural',
  'Bogotá Cultural: La Guía Definitiva para el Viajero Premium',
  'Todo lo que necesitas saber para vivir Bogotá como un local: barrios, gastronomía, arte y experiencias que no encontrarás en ningún otro lugar.',
  E'# Bogotá Cultural: La Guía Definitiva\n\nBogotá es una de las ciudades más fascinantes e incomprendidas de América Latina. A 2.600 metros de altura, con un clima eterno de otoño europeo y una escena cultural que rivala con cualquier capital del mundo, la ciudad te sorprende desde el primer día.\n\n## ¿Por qué Bogotá?\n\nNo es solo una parada de tránsito. Es un destino en sí mismo.\n\n- **La Candelaria**: el centro histórico colonial con calles empedradas, museos de clase mundial y el mítico Cerro de Monserrate de fondo.\n- **Usaquén**: pueblo dentro de la ciudad, con mercado de antigüedades los domingos y restaurantes que fusionan lo local con lo internacional.\n- **El Parque de la 93 y Zona Rosa**: el corazón cosmopolita donde la gastronomía colombiana contemporánea brilla con fuerza propia.\n\n## Gastronomía que Define al País\n\nBogotá concentra lo mejor de cada región:\n\n- **Ajiaco bogotano**: la sopa que define la identidad de la ciudad. Papas criollas, pollo, guascas y crema de leche.\n- **Fritanga**: contundente y auténtica — chicharrón, chorizo y papa criolla.\n- **Cafés de especialidad**: la explosión del café colombiano de tercera ola tiene su epicentro en La Candelaria y Chapinero.\n\n## Qué Ver y Hacer\n\n### Museos\n- **Museo del Oro (Banco de la República)**: la colección precolombina más importante del planeta. Entrada gratuita los domingos.\n- **Museo Botero**: 123 obras donadas por Fernando Botero al pueblo colombiano. Gratuito.\n- **Museo de Bogotá**: para entender la historia de la ciudad desde adentro.\n\n### Arte Urbano\nBogotá es reconocida mundialmente por su arte callejero. El barrio La Candelaria y la Carrera Séptima son galerías al aire libre. Los murales cuentan historias de resistencia, paz y diversidad cultural.\n\n### El Ciclovía\nCada domingo y festivo, más de 120 km de vías se cierran a los carros y se abren a ciclistas, corredores y peatones. Una experiencia única en el mundo.\n\n## Cómo Moverse\n\n**TransMilenio** cubre la ciudad con su red de buses de alta capacidad. Para recorridos cortos, los taxis y plataformas como InDriver son seguros y económicos. Para los barrios más turísticos, caminar es la mejor opción.\n\n## Consejos Prácticos\n\n- **Clima**: lleva siempre una chaqueta. El dicho local es: *"En Bogotá hay cuatro estaciones en un día"*.\n- **Altitud**: si vienes de baja altura, los primeros días puedes sentir soroche (mal de altura). Hidratación y descanso.\n- **Seguridad**: como en cualquier ciudad grande, usa el sentido común. Los barrios turísticos son seguros.\n- **Moneda**: el peso colombiano (COP). Un café de especialidad cuesta entre COP 8.000 y 15.000.\n\n## Experiencias KCE en Bogotá\n\nNuestros tours están diseñados para ir más allá de lo obvio:\n\n- **Bogotá Coffee Culture**: café de origen, tostión artesanal y barrios bohemios con guía experto.\n- **Arte Urbano & Candelaria**: el corazón histórico y político de Colombia a pie, con contexto real.\n- **Gastronomía Bogotana**: mercados, cocinas locales y sabores que no se encuentran en restaurantes turísticos.\n\n---\n\n*¿Listo para conocer la Bogotá que pocos viajeros ven?* [Explora nuestros tours →](/tours)',
  '/images/hero-kce.jpg',
  ARRAY['bogotá', 'cultura', 'guía', 'gastronomía', 'arte'],
  'es',
  'published',
  NOW()
)
on conflict (slug) do nothing;

-- English version
insert into public.posts (
  slug, title, excerpt, content_md, cover_url, tags, lang, status, published_at
) values (
  'bogota-cultural-guide-premium-traveler',
  'Bogotá Cultural: The Definitive Guide for the Premium Traveler',
  'Everything you need to know to experience Bogotá like a local: neighborhoods, food, art and experiences you won''t find anywhere else.',
  E'# Bogotá Cultural: The Definitive Guide\n\nBogotá is one of the most fascinating and misunderstood cities in Latin America. At 2,600 meters above sea level, with a perpetual autumn climate and a cultural scene that rivals any world capital, the city surprises you from day one.\n\n## Why Bogotá?\n\nIt''s not just a transit stop. It''s a destination in itself.\n\n- **La Candelaria**: the colonial historic center with cobblestone streets, world-class museums, and the mythic Cerro de Monserrate as backdrop.\n- **Usaquén**: a village within the city, with an antique market on Sundays and restaurants fusing local and international flavors.\n- **Parque de la 93 & Zona Rosa**: the cosmopolitan heart where contemporary Colombian cuisine shines.\n\n## Must-Do Experiences with KCE\n\n- **Bogotá Coffee Culture**: specialty coffee, artisan roasting and bohemian neighborhoods with an expert guide.\n- **Street Art & La Candelaria**: the historic and political heart of Colombia on foot, with real context.\n- **Bogotá Gastronomy**: markets, local kitchens and flavors you won''t find in tourist restaurants.\n\n---\n\n*Ready to discover the Bogotá few travelers ever see?* [Explore our tours →](/en/tours)',
  '/images/hero-kce.jpg',
  ARRAY['bogotá', 'culture', 'guide', 'gastronomy', 'art'],
  'en',
  'published',
  NOW()
)
on conflict (slug) do nothing;
