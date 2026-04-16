import { FastifyInstance } from 'fastify';

import { FeedbackController } from './feedback.controller';

/** Feedback routes — mounted at /api/feedback. */
export default async function feedbackRoutes(fastify: FastifyInstance): Promise<void> {
  /* Public routes */
  fastify.get('/public', FeedbackController.getPublic);

  /* Optionally authenticated — guests can submit with email */
  fastify.post('/', { preHandler: [fastify.optionalAuth] }, FeedbackController.submit);

  /* Authenticated routes */
  fastify.get('/mine', { preHandler: [fastify.authenticate] }, FeedbackController.getMine);

  /* Admin route — uses authenticate; service-level admin check can be added later */
  fastify.patch('/:id', { preHandler: [fastify.authenticate] }, FeedbackController.adminUpdate);
}
