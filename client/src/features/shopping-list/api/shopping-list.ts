import api from '../../../api/axios';

interface ShoppingItem {
  _id: string;
  name: string;
  amount: string;
  recipeId?: string;
  recipeTitle?: string;
  isChecked: boolean;
}

interface ShoppingList {
  _id: string;
  owner: string;
  items: ShoppingItem[];
}

/** Fetch the current user's shopping list. */
export const getShoppingList = () =>
  api.get<{ shoppingList: ShoppingList }>('/shopping-list');

/** Add all ingredients from a recipe to the shopping list. */
export const addRecipeToShoppingList = (recipeId: string) =>
  api.post<{ shoppingList: ShoppingList }>(`/shopping-list/add-recipe/${recipeId}`);

/** Toggle an item's checked state. */
export const toggleShoppingItem = (itemId: string, isChecked: boolean) =>
  api.put<{ shoppingList: ShoppingList }>(`/shopping-list/items/${itemId}`, { isChecked });

/** Remove a single item from the shopping list. */
export const removeShoppingItem = (itemId: string) =>
  api.delete<{ shoppingList: ShoppingList }>(`/shopping-list/items/${itemId}`);

/** Clear all items from the shopping list. */
export const clearShoppingList = () =>
  api.delete<{ message: string }>('/shopping-list');

export type { ShoppingItem, ShoppingList };
