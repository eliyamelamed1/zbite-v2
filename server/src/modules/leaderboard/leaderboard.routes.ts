import { FastifyInstance } from 'fastify';

import { LeaderboardController } from './leaderboard.controller';

/** Leaderboard routes — mounted at /api/leaderboard. */
export default async function leaderboardRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', LeaderboardController.getLeaderboard);
}
