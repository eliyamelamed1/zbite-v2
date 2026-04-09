import { FastifyInstance } from 'fastify';

import { CollectionController } from './collection.controller';

// ---------------------------------------------------------------------------
// Collection routes — mounted at /api/collections
// ---------------------------------------------------------------------------

/** Collection routes — mounted at /api/collections. */
export default async function collectionRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { preHandler: [fastify.authenticate] }, CollectionController.listCollections);
  fastify.post('/', { preHandler: [fastify.authenticate] }, CollectionController.createCollection);
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, CollectionController.getCollection);
  fastify.put('/:id', { preHandler: [fastify.authenticate] }, CollectionController.updateCollection);
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, CollectionController.deleteCollection);
  fastify.post('/:id/recipes/:recipeId', { preHandler: [fastify.authenticate] }, CollectionController.addRecipe);
  fastify.delete('/:id/recipes/:recipeId', { preHandler: [fastify.authenticate] }, CollectionController.removeRecipe);
}
