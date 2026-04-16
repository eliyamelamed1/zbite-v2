import { FastifyInstance } from 'fastify';

import { ShoppingListController } from './shopping-list.controller';

// ---------------------------------------------------------------------------
// Shopping list routes — mounted at /api/shopping-list
// ---------------------------------------------------------------------------

/** Shopping list routes — mounted at /api/shopping-list. */
export default async function shoppingListRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { preHandler: [fastify.authenticate] }, ShoppingListController.getList);
  fastify.post('/add-recipe/:recipeId', { preHandler: [fastify.authenticate] }, ShoppingListController.addRecipe);
  fastify.put('/items/:itemId', { preHandler: [fastify.authenticate] }, ShoppingListController.toggleItem);
  fastify.delete('/items/:itemId', { preHandler: [fastify.authenticate] }, ShoppingListController.removeItem);
  fastify.delete('/', { preHandler: [fastify.authenticate] }, ShoppingListController.clearList);
}
