import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller';

/** Auth routes — register, login, get current user, save interests. */
export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/register', AuthController.register);
  fastify.post('/login', AuthController.login);
  fastify.get('/me', { preHandler: [fastify.authenticate] }, AuthController.getMe);
  fastify.put('/interests', { preHandler: [fastify.authenticate] }, AuthController.saveInterests);
}
