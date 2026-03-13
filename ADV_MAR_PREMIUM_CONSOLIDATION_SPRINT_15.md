# ADV MAR Premium Consolidation Sprint 15

## Objetivo
Pasar de build estable a una base más premium y más operable en dev/prod.

## Cambios principales
- `next.config.ts`
  - `allowedDevOrigins` ahora se construye desde `ALLOWED_DEV_ORIGINS` y defaults seguros.
  - incluye `localhost`, `127.0.0.1`, tu IP LAN actual y `NEXT_PUBLIC_SITE_URL` si corre por HTTP en dev.
- `.env.example`
  - nueva variable documentada: `ALLOWED_DEV_ORIGINS`
- `src/app/(marketing)/page.tsx`
  - nueva sección comercial / trust / conversion paths
  - `CaptureCtas` ahora recibe `locale`
- `src/app/(marketing)/destinations/page.tsx`
  - nueva sección “cómo usar destinations para vender mejor”
  - rutas rápidas comerciales
- `src/app/(marketing)/destinations/[slug]/page.tsx`
  - nueva sección de cierre por ciudad y fast lane a contacto/quiz/catálogo
- `src/app/(marketing)/quiz/page.tsx`
  - resolución de locale server-side
  - metadata canonical localizada
  - links localizados en CTA/footer
  - nueva franja de 3 pasos antes del formulario
- `src/features/marketing/QuizForm.tsx`
  - locale detectado desde pathname
  - botón de reinicio
  - resultados con resumen comercial + CTAs a tour/contact/wishlist

## Revisión edge/node
- Se revisó la base actual y solo se mantiene `runtime='edge'` en opengraph image routes.
- No se cambiaron otras páginas a edge para no sacrificar generación estática o introducir regresiones innecesarias.
- La recomendación es mantener Node.js para páginas/handlers con lógica de datos y reservar edge para OG/middleware/light request logic.

## Siguiente paso recomendado
1. `npm run build`
2. `npm run dev`
3. probar desde LAN/celular y ajustar `ALLOWED_DEV_ORIGINS` si cambia la IP
4. validar UX en:
   - `/es`
   - `/es/destinations`
   - `/es/destinations/bogota`
   - `/es/quiz`
