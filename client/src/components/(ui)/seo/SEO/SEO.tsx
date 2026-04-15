import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  canonicalUrl?: string;
  type?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const DEFAULT_TITLE = 'zbite — What Should I Cook?';
const DEFAULT_DESCRIPTION = 'Pick your mood, get a recipe, start cooking. A mood-based recipe decider with social cooking community.';
const DEFAULT_OG_IMAGE = '/og-default.png';

/** Renders dynamic <head> meta tags for SEO, structured data, and social sharing. */
export default function SEO({ title, description, image, canonicalUrl, type = 'website', noindex = false, jsonLd }: SEOProps) {
  const pageTitle = title ? `${title} | zbite` : DEFAULT_TITLE;
  const pageDescription = description ?? DEFAULT_DESCRIPTION;
  const ogImage = image ?? DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      {noindex && <meta name="robots" content="noindex" />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="zbite" />
      <meta property="og:image" content={ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      {image && <meta name="twitter:image" content={image} />}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
