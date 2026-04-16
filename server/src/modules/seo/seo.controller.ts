import { FastifyRequest, FastifyReply } from 'fastify';

import { SeoService } from './seo.service';

const ONE_HOUR_SECONDS = 3600;

/** Handles SEO-related HTTP endpoints (sitemap, etc.). */
export const SeoController = {
  async getSitemap(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const xml = await SeoService.generateSitemap();
    return reply
      .type('application/xml')
      .header('Cache-Control', `public, max-age=${ONE_HOUR_SECONDS}`)
      .send(xml);
  },
};
