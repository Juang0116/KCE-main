export default function Head() {
  const title = "Privacidad y Cookies | KCE Colombia";
  const description = "Gestiona tus preferencias de navegación en la plataforma editorial de KCE. Transparencia y confianza en cada clic.";
  const url = "https://kce.travel/cookies";
  const image = "/images/hero-kce.jpg"; // Asegúrate que esta ruta exista o usa una de branding azul

  return (
    <>
      {/* Título dinámico con el branding nuevo */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index,follow" />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Favicons y Mobile Branding */}
      <meta name="theme-color" content="var(--brand-blue)" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
    </>
  );
}