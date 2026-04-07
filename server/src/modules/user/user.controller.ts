import { MultipartFile } from '@fastify/multipart';
import { FastifyRequest, FastifyReply } from 'fastify';

import { UserService } from './user.service';

import type { SearchUsersQuery, ProfileParams } from './user.schemas';

const EMPTY_SEARCH_RESULT = {
  data: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
};

/** User controller — parses requests, calls service, shapes responses. */
export const UserController = {
  /** GET /users/search?q=&page=&limit= */
  async search(
    request: FastifyRequest<{ Querystring: SearchUsersQuery }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { q, page, limit } = request.query;
    if (!q) return reply.send(EMPTY_SEARCH_RESULT);

    const result = await UserService.searchUsers(q, Number(page), Number(limit));
    return reply.send(result);
  },

  /** GET /users/:id */
  async getProfile(
    request: FastifyRequest<{ Params: ProfileParams }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { id } = request.params;
    const profile = await UserService.getProfile(id);
    return reply.send(profile);
  },

  /** PUT /users/profile — multipart form: avatar (file) + bio (field). */
  async updateProfile(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const parts = request.parts();

    let bio: string | undefined;
    let avatarFile: MultipartFile | undefined;

    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'avatar') {
        avatarFile = part;
      }

      if (part.type === 'field' && part.fieldname === 'bio') {
        bio = part.value as string;
      }
    }

    // authUser is set by the authenticate preHandler — safe to assert
    const user = await UserService.updateProfile(request.authUser!.id, {
      bio,
      avatarFile,
    });

    return reply.send({ user });
  },

  /** GET /users/suggested */
  async getSuggested(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    // authUser is set by the authenticate preHandler — safe to assert
    const users = await UserService.getSuggestedUsers(request.authUser!.id);
    return reply.send({ data: users });
  },
};
