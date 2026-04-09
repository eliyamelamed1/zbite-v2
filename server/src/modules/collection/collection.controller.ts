import { FastifyRequest, FastifyReply } from 'fastify';

import { CollectionService } from './collection.service';
import {
  CollectionIdParamsSchema,
  CollectionRecipeParamsSchema,
  CreateCollectionBodySchema,
  UpdateCollectionBodySchema,
} from './collection.schemas';

// ---------------------------------------------------------------------------
// Controller — parses requests, calls service, shapes responses.
// Never contains business logic or direct DB access.
// ---------------------------------------------------------------------------

/** Collection controller — handles HTTP requests for collection features. */
export const CollectionController = {
  /** GET / — list the current user's collections. */
  async listCollections(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // authUser set by authenticate preHandler — safe to assert
    const result = await CollectionService.listCollections(request.authUser!.id);
    return reply.send(result);
  },

  /** POST / — create a new collection. */
  async createCollection(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = CreateCollectionBodySchema.parse(request.body);
    const result = await CollectionService.createCollection(request.authUser!.id, body);
    return reply.status(201).send(result);
  },

  /** GET /:id — get a single collection with populated recipes. */
  async getCollection(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = CollectionIdParamsSchema.parse(request.params);
    const result = await CollectionService.getCollection(id, request.authUser!.id);
    return reply.send(result);
  },

  /** PUT /:id — update a collection's name/description. */
  async updateCollection(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = CollectionIdParamsSchema.parse(request.params);
    const body = UpdateCollectionBodySchema.parse(request.body);
    const result = await CollectionService.updateCollection(id, request.authUser!.id, body);
    return reply.send(result);
  },

  /** DELETE /:id — delete a collection. */
  async deleteCollection(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = CollectionIdParamsSchema.parse(request.params);
    await CollectionService.deleteCollection(id, request.authUser!.id);
    return reply.status(204).send();
  },

  /** POST /:id/recipes/:recipeId — add a recipe to a collection. */
  async addRecipe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id, recipeId } = CollectionRecipeParamsSchema.parse(request.params);
    const result = await CollectionService.addRecipe(id, recipeId, request.authUser!.id);
    return reply.send(result);
  },

  /** DELETE /:id/recipes/:recipeId — remove a recipe from a collection. */
  async removeRecipe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id, recipeId } = CollectionRecipeParamsSchema.parse(request.params);
    const result = await CollectionService.removeRecipe(id, recipeId, request.authUser!.id);
    return reply.send(result);
  },
};
