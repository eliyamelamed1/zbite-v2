import { FastifyInstance } from 'fastify';

import { SeoController } from './seo.controller';

/** SEO routes — mounted at root level (no /api prefix). */
export default async function seoRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/sitemap.xml', SeoController.getSitemap);
}
