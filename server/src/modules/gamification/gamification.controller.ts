import { FastifyRequest, FastifyReply } from 'fastify';

import { GamificationService } from './gamification.service';

// ---------------------------------------------------------------------------
// Controller — parses requests, calls service, shapes responses.
// Never contains business logic or direct DB access.
// ---------------------------------------------------------------------------

/** Gamification controller — handles HTTP requests for streaks and achievements. */
export const GamificationController = {
  /** GET /streaks/me — get the current user's streak data. */
  async getStreak(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // authUser set by authenticate preHandler — safe to assert
    const result = await GamificationService.getStreak(request.authUser!.id);
    return reply.send(result);
  },

  /** GET /achievements/me — get the current user's unlocked achievements. */
  async getAchievements(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await GamificationService.getAchievements(request.authUser!.id);
    return reply.send(result);
  },

  /** POST /cook — record a cook event for the current user. */
  async recordCook(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await GamificationService.recordCook(request.authUser!.id);
    return reply.send(result);
  },
};
