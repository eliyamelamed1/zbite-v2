import { FastifyInstance } from 'fastify';

import { UserController } from './user.controller';

/** User routes — search, profile, update, suggested users. */
export default async function userRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/search', UserController.search);
  fastify.get('/suggested', { preHandler: [fastify.authenticate] }, UserController.getSuggested);
  fastify.get('/:id', UserController.getProfile);
  fastify.put('/profile', { preHandler: [fastify.authenticate] }, UserController.updateProfile);
}
