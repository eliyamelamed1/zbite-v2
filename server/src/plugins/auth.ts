import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthUser } from '../shared/types';

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
}

/** Fastify plugin that decorates the instance with authenticate/optionalAuth hooks. */
async function authPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    const header = request.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return reply.status(401).send({ error: { message: 'Not authenticated', status: 401 } });
    }
    try {
      const decoded = jwt.verify(header.split(' ')[1], env.JWT_SECRET) as AuthUser;
      request.authUser = decoded;
    } catch {
      return reply.status(401).send({ error: { message: 'Invalid token', status: 401 } });
    }
  });

  fastify.decorate('optionalAuth', async function (request: FastifyRequest) {
    const header = request.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(header.split(' ')[1], env.JWT_SECRET) as AuthUser;
        request.authUser = decoded;
      } catch {
        // Token invalid — proceed without auth (optional auth)
        request.log.debug('Optional auth: invalid token, proceeding without user');
      }
    }
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    optionalAuth: (request: FastifyRequest) => Promise<void>;
  }
}

export default fp(authPlugin);
