import { FastifyInstance } from 'fastify';

import { CookingReportController } from './cooking-report.controller';

/** Cooking report routes -- create and list "I Made This" reports on recipes. */
export default async function cookingReportRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/:recipeId/reports', CookingReportController.getReports);
  fastify.post(
    '/:recipeId/reports',
    { preHandler: [fastify.authenticate] },
    CookingReportController.create,
  );
}
