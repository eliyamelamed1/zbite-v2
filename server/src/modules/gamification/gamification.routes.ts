import { FastifyInstance } from 'fastify';

import { GamificationController } from './gamification.controller';

// ---------------------------------------------------------------------------
// Gamification routes — mounted at /api/gamification
// ---------------------------------------------------------------------------

/** Gamification routes — mounted at /api/gamification. */
export default async function gamificationRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/streaks/me', { preHandler: [fastify.authenticate] }, GamificationController.getStreak);
  fastify.get('/achievements/me', { preHandler: [fastify.authenticate] }, GamificationController.getAchievements);
  fastify.get('/achievements/:userId', GamificationController.getUserAchievements);
  fastify.post('/cook', { preHandler: [fastify.authenticate] }, GamificationController.recordCook);
}
