import { FastifyRequest, FastifyReply } from 'fastify';

import { LeaderboardService } from './leaderboard.service';
import { parsePaginationQuery } from '../../shared/utils/pagination';
import { LeaderboardQuerySchema } from './leaderboard.schemas';

const DEFAULT_LEADERBOARD_LIMIT = 20;

/** Leaderboard controller — parses request, calls service, shapes response. */
export const LeaderboardController = {
  /** GET / — fetch the ranked leaderboard. */
  async getLeaderboard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = LeaderboardQuerySchema.parse(request.query);
    const { page, limit, skip } = parsePaginationQuery(query, DEFAULT_LEADERBOARD_LIMIT);
    const result = await LeaderboardService.getLeaderboard(query.period, page, limit, skip);
    return reply.send(result);
  },
};
