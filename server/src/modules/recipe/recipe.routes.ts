import { FastifyInstance } from 'fastify';

import { RecipeController } from './recipe.controller';

/** Recipe routes -- CRUD, explore feed, following feed, user recipes. */
export default async function recipeRoutes(fastify: FastifyInstance): Promise<void> {
  /* ---------- Public routes (with optional auth for personalization) ---------- */
  fastify.get('/explore', { preHandler: [fastify.optionalAuth] }, RecipeController.explore);
  fastify.get('/user/:userId', RecipeController.userRecipes);
  fastify.get('/:id', RecipeController.getById);

  /* ---------- Authenticated routes ---------- */
  fastify.post('/', { preHandler: [fastify.authenticate] }, RecipeController.create);
  fastify.get('/drafts', { preHandler: [fastify.authenticate] }, RecipeController.drafts);
  fastify.get('/following', { preHandler: [fastify.authenticate] }, RecipeController.following);
  fastify.put('/:id', { preHandler: [fastify.authenticate] }, RecipeController.update);
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, RecipeController.remove);
}
