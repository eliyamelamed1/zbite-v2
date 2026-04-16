import Recipe from '../../models/Recipe';
import User from '../../models/User';
import { env } from '../../config/env';

const ONE_HOUR_SECONDS = 3600;

/** Cache the generated sitemap XML to avoid querying the DB on every bot request. */
let cachedSitemap = '';
let cacheTimestamp = 0;

/** Generates a full XML sitemap with all published recipes and user profiles. */
export const SeoService = {
  async generateSitemap(): Promise<string> {
    const now = Date.now();
    const isCacheValid = cachedSitemap && (now - cacheTimestamp) < ONE_HOUR_SECONDS * 1000;
    if (isCacheValid) return cachedSitemap;

    const baseUrl = env.CLIENT_URL;

    const [recipes, users] = await Promise.all([
      Recipe.find({ status: 'published' }).select('_id updatedAt').lean(),
      User.find().select('_id username updatedAt').lean(),
    ]);

    const urls: string[] = [
      buildUrlEntry(baseUrl, '/', '1.0'),
      buildUrlEntry(baseUrl, '/feed', '0.8'),
      buildUrlEntry(baseUrl, '/leaderboard', '0.6'),
    ];

    for (const recipe of recipes) {
      const lastmod = recipe.updatedAt ? new Date(recipe.updatedAt).toISOString() : undefined;
      urls.push(buildUrlEntry(baseUrl, `/recipe/${recipe._id}`, '0.7', lastmod));
    }

    for (const user of users) {
      const lastmod = user.updatedAt ? new Date(user.updatedAt).toISOString() : undefined;
      urls.push(buildUrlEntry(baseUrl, `/user/${user._id}`, '0.5', lastmod));
    }

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls,
      '</urlset>',
    ].join('\n');

    cachedSitemap = xml;
    cacheTimestamp = now;

    return xml;
  },
};

/** Builds a single <url> entry for the sitemap XML. */
function buildUrlEntry(baseUrl: string, path: string, priority: string, lastmod?: string): string {
  const lines = [
    '  <url>',
    `    <loc>${baseUrl}${path}</loc>`,
    `    <priority>${priority}</priority>`,
  ];
  if (lastmod) {
    lines.push(`    <lastmod>${lastmod}</lastmod>`);
  }
  lines.push('  </url>');
  return lines.join('\n');
}
