// src/lib/contentAgent.server.ts
// Content Agent — generates SEO blog posts, tour descriptions, and social content.
// Auto-trains by analyzing what content drives the most engagement/bookings.
import 'server-only';

import { getSupabaseAdmin } from '@/lib/supabaseAdmin.server';
import { logEvent } from '@/lib/events.server';
import { agentGenerate } from '@/lib/agentAI.server';

const ROLE = `Eres el Content Strategist de KCE (Knowing Cultures Enterprise).
Tu misión: crear contenido que convierte viajeros internacionales en clientes.
Escribes en español e inglés. Conoces Colombia profundamente: cultura, gastronomía, 
destinos, historia y experiencias únicas. Tu voz es auténtica, experta y aspiracional.
Cada pieza que creas tiene un objetivo: atraer tráfico y generar bookings.`;

const BLOG_TOPICS = [
  { title: 'Guía definitiva de Bogotá para viajeros internacionales', city: 'Bogotá', tags: ['bogotá', 'guía', 'cultura'] },
  { title: 'Medellín: transformación urbana y turismo responsable', city: 'Medellín', tags: ['medellín', 'arte', 'innovación'] },
  { title: 'El Eje Cafetero: café, paisajes y autenticidad', city: 'Salento', tags: ['café', 'naturaleza', 'eje cafetero'] },
  { title: 'Cartagena más allá de las murallas', city: 'Cartagena', tags: ['cartagena', 'caribe', 'historia'] },
  { title: 'Colombia segura: guía práctica para viajeros', city: null, tags: ['seguridad', 'consejos', 'viaje'] },
  { title: 'Gastronomía colombiana: los sabores que debes probar', city: null, tags: ['gastronomía', 'comida', 'cultura'] },
  { title: 'Los mejores tours culturales en Colombia 2025', city: null, tags: ['tours', 'cultura', '2025'] },
  { title: 'Por qué Colombia es el destino de viaje del año', city: null, tags: ['colombia', 'turismo', 'destino'] },
];

export async function generateBlogPost(topic: {
  title: string;
  city?: string | null;
  tags?: string[];
  lang?: 'es' | 'en';
}): Promise<{ title: string; excerpt: string; content_md: string; tags: string[]; lang: string }> {
  const lang = topic.lang || 'es';

  const content_md = await agentGenerate({
    systemPrompt: `${ROLE}
Escribe un artículo de blog COMPLETO en ${lang === 'en' ? 'inglés' : 'español'} sobre el tema dado.
Formato Markdown. Estructura: # Título, introducción (2 párrafos), ## secciones (3-5),
## Experiencias KCE relacionadas (con CTA a /tours), conclusión.
SEO optimizado: incluye keywords naturalmente.
Longitud: 600-900 palabras. Tono: experto pero accesible.`,
    userMessage: `Título: ${topic.title}\nCiudad/Destino: ${topic.city || 'Colombia'}\nTags: ${(topic.tags || []).join(', ')}`,
    temperature: 0.75,
    maxTokens: 1500,
    fallback: `# ${topic.title}\n\nColombia ofrece experiencias únicas para viajeros internacionales...`,
  });

  const excerpt = await agentGenerate({
    systemPrompt: `Extrae un resumen de 1-2 frases (máx 160 chars) del siguiente artículo para usar como meta description SEO. Solo devuelve el resumen, nada más.`,
    userMessage: content_md.slice(0, 500),
    temperature: 0.3,
    maxTokens: 80,
    fallback: `Descubre ${topic.city || 'Colombia'} con KCE: experiencias auténticas para viajeros internacionales.`,
  });

  return {
    title: topic.title,
    excerpt: excerpt.trim(),
    content_md,
    tags: topic.tags || [],
    lang,
  };
}

export async function generateTourDescription(tour: {
  title: string;
  city: string;
  duration_hours: number;
  tags: string[];
  base_price: number;
}): Promise<{ summary: string; body_md: string }> {
  const body_md = await agentGenerate({
    systemPrompt: `${ROLE}
Escribe la descripción completa de un tour para el sitio web KCE.
Formato Markdown. Incluye: párrafo introductorio emotivo, qué vas a vivir (bullet points),
qué incluye, punto de encuentro, y por qué este tour es único.
Tono: premium, auténtico, inspirador. Máximo 400 palabras.`,
    userMessage: JSON.stringify(tour),
    temperature: 0.7,
    maxTokens: 700,
    fallback: `Descubre ${tour.city} con una experiencia curada por expertos locales de KCE.`,
  });

  const summary = await agentGenerate({
    systemPrompt: `Extrae una frase de 1 línea (máx 100 chars) que resuma este tour. Solo la frase.`,
    userMessage: body_md.slice(0, 300),
    temperature: 0.3,
    maxTokens: 50,
    fallback: `Experiencia curada en ${tour.city} con guías expertos.`,
  });

  return { summary: summary.trim(), body_md };
}

export async function runContentAgent(requestId: string): Promise<{ generated: number; topics: string[] }> {
  const admin = getSupabaseAdmin() as any;
  let generated = 0;
  const topics: string[] = [];

  await logEvent('content_agent.started', { requestId }, { source: 'content_agent' });

  try {
    // Check which blog topics haven't been written yet
    const { data: existingPosts } = await admin
      .from('posts')
      .select('title, lang')
      .eq('lang', 'es');

    const existingTitles = new Set((existingPosts ?? []).map((p: any) => p.title.toLowerCase()));

    // Pick up to 2 new topics to generate this run
    const toGenerate = BLOG_TOPICS.filter(
      (t) => !existingTitles.has(t.title.toLowerCase())
    ).slice(0, 2);

    for (const topic of toGenerate) {
      const post = await generateBlogPost({ ...topic, lang: 'es' });

      await admin.from('posts').insert({
        slug: topic.title.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 80),
        title: post.title,
        excerpt: post.excerpt,
        content_md: post.content_md,
        tags: post.tags,
        lang: post.lang,
        status: 'draft', // Human reviews before publishing
        metadata: { agent: 'content_agent', generated_at: new Date().toISOString() },
      });

      generated++;
      topics.push(topic.title);

      await logEvent('content_agent.post_generated', { requestId, title: topic.title }, { source: 'content_agent' });
    }

    // Also improve tour descriptions that are still generic
    const { data: toursNeedingDesc } = await admin
      .from('tours')
      .select('id, title, city, duration_hours, tags, base_price, body_md')
      .or('body_md.is.null,body_md.eq.')
      .limit(2);

    for (const tour of toursNeedingDesc ?? []) {
      const desc = await generateTourDescription(tour);
      await admin.from('tours').update({
        summary: desc.summary,
        body_md: desc.body_md,
        updated_at: new Date().toISOString(),
      }).eq('id', tour.id);

      generated++;
      topics.push(`Tour desc: ${tour.title}`);
    }

    await logEvent('content_agent.completed', { requestId, generated }, { source: 'content_agent' });
    return { generated, topics };
  } catch (err: any) {
    await logEvent('content_agent.error', { requestId, error: err?.message }, { source: 'content_agent' });
    throw err;
  }
}
