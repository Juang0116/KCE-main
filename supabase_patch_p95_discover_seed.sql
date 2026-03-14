-- supabase_patch_p95_discover_seed.sql
-- Seeds curated discover content. Safe to run multiple times (ON CONFLICT DO NOTHING).
-- Discover page shows posts + videos sorted by date.

-- Add a few more blog posts (discover content)
insert into public.posts (slug, title, excerpt, content_md, cover_url, tags, lang, status, published_at)
values
(
  'guia-medellín-turismo',
  'Medellín: de la reinvención a destino imprescindible',
  'Cómo Medellín pasó de titular de portada por las razones equivocadas a convertirse en el símbolo más potente de transformación urbana de América Latina.',
  E'# Medellín: La Ciudad que se Reinventó\n\nEn los años 90, el nombre de Medellín aparecía en las noticias por las razones equivocadas. Hoy, la misma ciudad figura entre los destinos más innovadores del mundo, gana premios de diseño urbano y recibe a millones de turistas que vienen a entender cómo ocurrió esa transformación.\n\n## El Barrio Más Fotografiado\n\nLa Candelaria es el símbolo de ese cambio. Sus murales de tres pisos narran décadas de historia, conflicto y esperanza. Cada pared es un capítulo. El metrocable que une el centro con las comunas de la montaña no es solo transporte — es la metáfora de una ciudad que decidió no abandonar a sus periferias.\n\n## Gastronomía que Enamora\n\n- **Bandeja paisa**: el plato más contundente de Colombia. Frijoles, chicharrón, arroz, aguacate, huevo y chorizo en un plato que habla de abundancia.\n- **Arepas de choclo**: más suaves y dulces que las bogotanas, perfectas con quesito.\n- **Mercado del Río**: el espacio gastronómico más vibrante de la ciudad, donde cocineros jóvenes reinterpretan la cocina colombiana.\n\n## Imperdibles con KCE\n\n- **Street Art & Transformation Tour**: el tour más honesto sobre la historia reciente de Medellín.\n- **Guatapé Day Trip**: desde Medellín en 2 horas, el embalse y La Piedra del Peñol.\n\n---\n\n*¿Listo para descubrir la Medellín que transformó un continente?* [Ver tours →](/tours)',
  '/images/tours/medellin.jpg',
  ARRAY['medellín', 'cultura', 'guía', 'arte', 'gastronomía'],
  'es', 'published', NOW() - interval '2 days'
),
(
  'eje-cafetero-guia-completa',
  'El Eje Cafetero: Salento, Cocora y el café que cambió el mundo',
  'Una guía honesta para vivir el corazón cafetero de Colombia: los pueblos, los paisajes, los caficultores y las experiencias que no salen en los folletos.',
  E'# El Eje Cafetero\n\nEl Eje Cafetero es la región donde nació el café que convirtió a Colombia en sinónimo de calidad en el mundo. Caldas, Quindío y Risaralda forman un triángulo de montañas verdes, fincas cafeteras y pueblos de arquitectura republicana que pocos destinos del mundo pueden igualar.\n\n## Salento\n\nEl pueblo más visitado del eje y el que mejor preserva su arquitectura. Sus calles de colores pastel, su plaza central de palmas de cera y su mirador sobre el Valle del Quindío son de esos lugares que se fijan en la memoria.\n\n## El Valle de Cocora\n\nA 15 minutos de Salento está uno de los paisajes más únicos del planeta. Las palmas de cera — árbol nacional de Colombia — pueden alcanzar los 60 metros de altura. El trekking circular de 4 horas combina bosque de niebla, cascadas y senderismo con las palmas como compañeras constantes.\n\n## Café de Verdad\n\nHacer el proceso completo en una finca — desde ver crecer el grano hasta tomarlo recién tostado — cambia la relación que uno tiene con el café para siempre. Las fincas alrededor de Salento y Filandia ofrecen tours de 1-2 horas que incluyen cosecha, despulpado y catación.\n\n## Tours KCE en el Eje\n\n- **Cocora Valley & Wax Palms**: el trekking más icónico del eje con guía experto.\n- **Bogotá Coffee Culture**: si quieres empezar el viaje del café desde la capital.\n\n---\n\n*El eje cafetero es uno de esos lugares que se sienten distintos. Resérvalo antes de que lo descubra todo el mundo.* [Ver tours →](/tours)',
  '/images/tours/cocora.jpg',
  ARRAY['eje cafetero', 'café', 'naturaleza', 'salento', 'guía'],
  'es', 'published', NOW() - interval '1 day'
)
on conflict (slug) do nothing;
