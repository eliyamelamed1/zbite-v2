import { FastifyInstance } from 'fastify';

import { RecipeController } from './recipe.controller';

/** Recipe routes -- CRUD, explore feed, following feed, user recipes. */
export default async function recipeRoutes(fastify: FastifyInstance): Promise<void> {
  /* ---------- Public routes (with optional auth for personalization) ---------- */
  fastify.get('/home', { preHandler: [fastify.optionalAuth] }, RecipeController.home);
  fastify.get('/explore', { preHandler: [fastify.optionalAuth] }, RecipeController.explore);
  fastify.get('/search', RecipeController.search);
  fastify.get('/recommend', { preHandler: [fastify.optionalAuth] }, RecipeController.recommend);
  fastify.get('/meal-suggestion', { preHandler: [fastify.optionalAuth] }, RecipeController.mealSuggestion);
  fastify.get('/user/:userId', RecipeController.userRecipes);
  fastify.get('/:id', { preHandler: [fastify.optionalAuth] }, RecipeController.getById);
  fastify.get('/:id/related', RecipeController.related);

  /* ---------- Authenticated routes ---------- */
  fastify.post('/', { preHandler: [fastify.authenticate] }, RecipeController.create);
  fastify.get('/drafts', { preHandler: [fastify.authenticate] }, RecipeController.drafts);
  fastify.get('/following', { preHandler: [fastify.authenticate] }, RecipeController.following);
  fastify.put('/:id', { preHandler: [fastify.authenticate] }, RecipeController.update);
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, RecipeController.remove);
}
