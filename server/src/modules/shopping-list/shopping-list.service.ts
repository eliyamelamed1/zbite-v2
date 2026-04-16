import { ShoppingListDal } from './shopping-list.dal';
import { NotFoundError } from '../../shared/errors';
import Recipe from '../../models/Recipe';

import type { IShoppingList } from '../../models/ShoppingList';

// ---------------------------------------------------------------------------
// Service — business logic with NO HTTP concerns
// ---------------------------------------------------------------------------

/** Shopping list service — orchestrates all shopping list actions. */
export const ShoppingListService = {
  /** Return the user's shopping list. */
  async getShoppingList(userId: string): Promise<IShoppingList> {
    return ShoppingListDal.findOrCreateByOwner(userId);
  },

  /** Find the recipe, extract ingredients, and merge them into the shopping list. */
  async addRecipeToList(userId: string, recipeId: string): Promise<IShoppingList> {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) throw new NotFoundError('Recipe', recipeId);

    const items = recipe.ingredients.map((ingredient) => ({
      name: ingredient.name,
      amount: ingredient.amount,
      recipeId: recipe._id,
      recipeTitle: recipe.title,
    }));

    return ShoppingListDal.addItems(userId, items);
  },

  /** Toggle the checked state of a specific item. */
  async toggleItem(userId: string, itemId: string, isChecked: boolean): Promise<IShoppingList> {
    const list = await ShoppingListDal.toggleItem(userId, itemId, isChecked);
    if (!list) throw new NotFoundError('ShoppingItem', itemId);

    return list;
  },

  /** Remove a single item from the shopping list. */
  async removeItem(userId: string, itemId: string): Promise<IShoppingList> {
    const list = await ShoppingListDal.removeItem(userId, itemId);
    if (!list) throw new NotFoundError('ShoppingItem', itemId);

    return list;
  },

  /** Clear all items from the shopping list. */
  async clearList(userId: string): Promise<IShoppingList> {
    const list = await ShoppingListDal.clearAll(userId);
    if (!list) throw new NotFoundError('ShoppingList', userId);

    return list;
  },
};
