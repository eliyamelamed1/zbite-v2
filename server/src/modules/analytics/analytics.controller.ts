import { FastifyRequest, FastifyReply } from 'fastify';

import { AnalyticsService } from './analytics.service';
import { AnalyticsQuerySchema } from './analytics.schemas';

const DEFAULT_DAYS = 30;

/** Analytics controller — parses requests, calls service, shapes responses. */
export const AnalyticsController = {
  /** GET /overview — aggregated creator stats. */
  async overview(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await AnalyticsService.getOverview(request.authUser!.id);
    return reply.send(result);
  },

  /** GET /recipes — per-recipe performance metrics. */
  async recipes(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await AnalyticsService.getRecipePerformance(request.authUser!.id);
    return reply.send({ data: result });
  },

  /** GET /engagement — daily engagement time-series. */
  async engagement(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = AnalyticsQuerySchema.parse(request.query);
    const days = Number(query.days) || DEFAULT_DAYS;
    const result = await AnalyticsService.getDailyEngagement(request.authUser!.id, days);
    return reply.send({ data: result });
  },
};
