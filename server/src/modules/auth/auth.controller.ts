import { FastifyRequest, FastifyReply } from 'fastify';

import { AuthService } from './auth.service';
import { RegisterBody, LoginBody, InterestsBody, GoogleAuthBody } from './auth.schemas';

const HTTP_CREATED = 201;

/** Auth controller — parses requests, calls service, shapes responses. */
export const AuthController = {
  async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as RegisterBody;
    const result = await AuthService.register(body);
    return reply.status(HTTP_CREATED).send(result);
  },

  async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as LoginBody;
    const result = await AuthService.login(body);
    return reply.send(result);
  },

  /** Authenticate via Google OAuth. Returns 201 for new users, 200 for existing. */
  async googleLogin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as GoogleAuthBody;
    const result = await AuthService.googleLogin(body.credential);
    const statusCode = result.isNewUser ? HTTP_CREATED : 200;
    return reply.status(statusCode).send(result);
  },

  async getMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // authUser is set by the auth preHandler
    const user = await AuthService.getMe(request.authUser!.id);
    return reply.send({ user });
  },

  async saveInterests(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as InterestsBody;
    const user = await AuthService.saveInterests(request.authUser!.id, body.interests);
    return reply.send({ user });
  },
};
