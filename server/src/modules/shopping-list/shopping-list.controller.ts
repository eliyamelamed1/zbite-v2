import { FastifyRequest, FastifyReply } from 'fastify';

import { ShoppingListService } from './shopping-list.service';
import {
  AddRecipeParamsSchema,
  ItemIdParamsSchema,
  ToggleItemBodySchema,
} from './shopping-list.schemas';

// ---------------------------------------------------------------------------
// Controller — parses requests, calls service, shapes responses.
// Never contains business logic or direct DB access.
// ---------------------------------------------------------------------------

/** Shopping list controller — handles HTTP requests for shopping list features. */
export const ShoppingListController = {
  /** GET / — get the current user's shopping list. */
  async getList(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    // authUser set by authenticate preHandler — safe to assert
    const result = await ShoppingListService.getShoppingList(request.authUser!.id);
    return reply.send({ shoppingList: result });
  },

  /** POST /add-recipe/:recipeId — add a recipe's ingredients to the shopping list. */
  async addRecipe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { recipeId } = AddRecipeParamsSchema.parse(request.params);
    const result = await ShoppingListService.addRecipeToList(request.authUser!.id, recipeId);
    return reply.status(201).send(result);
  },

  /** PUT /items/:itemId — toggle an item's checked state. */
  async toggleItem(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { itemId } = ItemIdParamsSchema.parse(request.params);
    const { isChecked } = ToggleItemBodySchema.parse(request.body);
    const result = await ShoppingListService.toggleItem(request.authUser!.id, itemId, isChecked);
    return reply.send(result);
  },

  /** DELETE /items/:itemId — remove a single item. */
  async removeItem(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { itemId } = ItemIdParamsSchema.parse(request.params);
    const result = await ShoppingListService.removeItem(request.authUser!.id, itemId);
    return reply.send(result);
  },

  /** DELETE / — clear all items from the shopping list. */
  async clearList(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await ShoppingListService.clearList(request.authUser!.id);
    return reply.send(result);
  },
};
