/* src/app/(marketing)/cookies/head.tsx */
export default function Head() {
  const title = "Transparencia Digital & Cookies | Knowing Cultures S.A.S.";
  const description = "Gestiona tus preferencias de privacidad. En Knowing Cultures S.A.S. (KCE) protegemos tu navegación bajo estándares internacionales de seguridad.";
  const url = "https://kce.travel/cookies";
  const image = "https://kce.travel/images/hero-kce.jpg";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* Identidad de Marca (Branding Metatags) */}
      <meta name="author" content="Knowing Cultures S.A.S." />
      <meta name="publisher" content="Knowing Cultures S.A.S." />

      {/* Open Graph / Facebook (Visualización Premium) */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="KCE • Knowing Cultures S.A.S." />
      <meta property="og:locale" content="es_CO" />

      {/* Twitter (Card de gran formato) */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@kce_travel" />

      {/* Mobile & App Branding (Configuración Técnica Superior) */}
      {/* El color Hexadecimal asegura que la barra de búsqueda en móvil sea Azul KCE */}
      <meta name="theme-color" content="#003876" /> 
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
    </>
  );
}