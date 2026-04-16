import ShoppingList from '../../models/ShoppingList';

import type { IShoppingList, IShoppingItem } from '../../models/ShoppingList';

/** Data Access Layer for all shopping-list Mongoose queries. */
export const ShoppingListDal = {
  /** Find or create the shopping list for a given owner. */
  async findOrCreateByOwner(ownerId: string): Promise<IShoppingList> {
    const existing = await ShoppingList.findOne({ owner: ownerId });
    if (existing) return existing;

    return ShoppingList.create({ owner: ownerId, items: [] });
  },

  /** Push new items to the list, merging duplicates by name. */
  async addItems(ownerId: string, items: Omit<IShoppingItem, 'isChecked'>[]): Promise<IShoppingList> {
    const list = await this.findOrCreateByOwner(ownerId);

    for (const newItem of items) {
      const existingItem = list.items.find(
        (item) => item.name.toLowerCase() === newItem.name.toLowerCase(),
      );

      if (existingItem) {
        // Update existing item in-place via atomic operator
        await ShoppingList.updateOne(
          { owner: ownerId, 'items._id': existingItem._id },
          {
            $set: {
              'items.$.amount': newItem.amount,
              'items.$.recipeId': newItem.recipeId,
              'items.$.recipeTitle': newItem.recipeTitle,
            },
          },
        );
      } else {
        // Push new item into the array
        await ShoppingList.updateOne(
          { owner: ownerId },
          { $push: { items: { ...newItem, isChecked: false } } },
        );
      }
    }

    // Return the fresh document after all mutations
    const updated = await ShoppingList.findOne({ owner: ownerId });
    return updated!; // safe: we just created/updated this document
  },

  /** Update isChecked on a specific item. Returns the updated list or null. */
  async toggleItem(ownerId: string, itemId: string, isChecked: boolean): Promise<IShoppingList | null> {
    return ShoppingList.findOneAndUpdate(
      { owner: ownerId, 'items._id': itemId },
      { $set: { 'items.$.isChecked': isChecked } },
      { new: true },
    );
  },

  /** Pull an item from the array. Returns the updated list or null. */
  async removeItem(ownerId: string, itemId: string): Promise<IShoppingList | null> {
    return ShoppingList.findOneAndUpdate(
      { owner: ownerId },
      { $pull: { items: { _id: itemId } } },
      { new: true },
    );
  },

  /** Set items to an empty array. Returns the updated list or null. */
  async clearAll(ownerId: string): Promise<IShoppingList | null> {
    return ShoppingList.findOneAndUpdate(
      { owner: ownerId },
      { $set: { items: [] } },
      { new: true },
    );
  },
};
