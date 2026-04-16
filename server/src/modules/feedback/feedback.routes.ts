import { FastifyInstance } from 'fastify';

import { FeedbackController } from './feedback.controller';

/** Feedback routes — mounted at /api/feedback. */
export default async function feedbackRoutes(fastify: FastifyInstance): Promise<void> {
  /* Public routes — optionalAuth so logged-in users get their vote status */
  fastify.get('/public', { preHandler: [fastify.optionalAuth] }, FeedbackController.getPublic);

  /* Optionally authenticated — guests can submit with email */
  fastify.post('/', { preHandler: [fastify.optionalAuth] }, FeedbackController.submit);

  /* Authenticated routes */
  fastify.get('/mine', { preHandler: [fastify.authenticate] }, FeedbackController.getMine);

  /* Voting routes */
  fastify.post('/:id/vote', { preHandler: [fastify.authenticate] }, FeedbackController.vote);
  fastify.delete('/:id/vote', { preHandler: [fastify.authenticate] }, FeedbackController.unvote);

  /* Admin routes — service-level admin guard enforced */
  fastify.get('/all', { preHandler: [fastify.authenticate] }, FeedbackController.getAll);
  fastify.patch('/:id', { preHandler: [fastify.authenticate] }, FeedbackController.adminUpdate);
}
