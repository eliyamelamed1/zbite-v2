import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { RegisterBody, LoginBody, InterestsBody } from './auth.schemas';

/** Auth controller — parses requests, calls service, shapes responses. */
export const AuthController = {
  async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as RegisterBody;
    const result = await AuthService.register(body);
    return reply.status(201).send(result);
  },

  async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as LoginBody;
    const result = await AuthService.login(body);
    return reply.send(result);
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
