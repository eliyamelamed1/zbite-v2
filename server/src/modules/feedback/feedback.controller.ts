import { FastifyRequest, FastifyReply } from 'fastify';

import { FeedbackService } from './feedback.service';
import { parsePaginationQuery } from '../../shared/utils/pagination';
import {
  CreateFeedbackBodySchema,
  UpdateFeedbackBodySchema,
  FeedbackIdParamsSchema,
  PublicFeedbackQuerySchema,
} from './feedback.schemas';

/** Feedback controller — parses requests, calls service, shapes responses. */
export const FeedbackController = {
  /** POST /api/feedback — submit feedback (authenticated or guest). */
  async submit(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = CreateFeedbackBodySchema.parse(request.body);
    const userId = request.authUser?.id ?? null;
    const result = await FeedbackService.submit(body, userId);
    return reply.status(201).send(result);
  },

  /** GET /api/feedback/public — get publicly approved feedback items with vote status. */
  async getPublic(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = PublicFeedbackQuerySchema.parse(request.query);
    const { page, limit, skip } = parsePaginationQuery(query);
    const userId = request.authUser?.id;
    const result = await FeedbackService.getPublic({ status: query.status, page, limit, skip, userId });
    return reply.send(result);
  },

  /** GET /api/feedback/mine — get the current user's own submissions. */
  async getMine(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await FeedbackService.getMine(request.authUser!.id);
    return reply.send(result);
  },

  /** GET /api/feedback/all — admin: list all feedback regardless of visibility. */
  async getAll(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = PublicFeedbackQuerySchema.parse(request.query);
    const { page, limit, skip } = parsePaginationQuery(query);
    const isAdmin = request.authUser?.isAdmin ?? false;
    const result = await FeedbackService.getAll({ status: query.status, page, limit, skip }, isAdmin);
    return reply.send(result);
  },

  /** POST /api/feedback/:id/vote — vote on a feedback item. */
  async vote(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = FeedbackIdParamsSchema.parse(request.params);
    await FeedbackService.vote(request.authUser!.id, id);
    return reply.send({ voted: true });
  },

  /** DELETE /api/feedback/:id/vote — remove vote from a feedback item. */
  async unvote(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = FeedbackIdParamsSchema.parse(request.params);
    await FeedbackService.unvote(request.authUser!.id, id);
    return reply.send({ voted: false });
  },

  /** PATCH /api/feedback/:id — admin: update status/visibility/response. */
  async adminUpdate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = FeedbackIdParamsSchema.parse(request.params);
    const body = UpdateFeedbackBodySchema.parse(request.body);
    const isAdmin = request.authUser?.isAdmin ?? false;
    const result = await FeedbackService.adminUpdate(id, body, isAdmin);
    return reply.send(result);
  },
};
