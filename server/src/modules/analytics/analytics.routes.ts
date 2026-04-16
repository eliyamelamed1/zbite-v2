import { FastifyInstance } from 'fastify';

import { AnalyticsController } from './analytics.controller';

/** Analytics routes — mounted at /api/analytics. */
export default async function analyticsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/overview', { preHandler: [fastify.authenticate] }, AnalyticsController.overview);
  fastify.get('/recipes', { preHandler: [fastify.authenticate] }, AnalyticsController.recipes);
  fastify.get('/engagement', { preHandler: [fastify.authenticate] }, AnalyticsController.engagement);
}
