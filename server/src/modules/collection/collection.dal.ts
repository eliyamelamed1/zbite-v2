import Collection from '../../models/Collection';

import type { ICollection } from '../../models/Collection';
import type { CreateCollectionBody, UpdateCollectionBody } from './collection.schemas';

/** Data Access Layer for all collection Mongoose queries. */
export const CollectionDal = {
  /** Find all collections owned by a user, sorted by newest first. */
  async findByOwner(ownerId: string): Promise<ICollection[]> {
    return Collection.find({ owner: ownerId }).sort({ createdAt: -1 });
  },

  /** Find a single collection by its id. */
  async findById(collectionId: string): Promise<ICollection | null> {
    return Collection.findById(collectionId);
  },

  /** Find a single collection by its id and populate recipe details. */
  async findByIdWithRecipes(collectionId: string): Promise<ICollection | null> {
    return Collection.findById(collectionId).populate('recipes');
  },

  /** Create a new collection. */
  async create(ownerId: string, data: CreateCollectionBody): Promise<ICollection> {
    return Collection.create({
      owner: ownerId,
      name: data.name,
      description: data.description ?? '',
    });
  },

  /** Update a collection's name and/or description. Returns the updated doc or null. */
  async update(collectionId: string, data: UpdateCollectionBody): Promise<ICollection | null> {
    return Collection.findByIdAndUpdate(collectionId, { $set: data }, { new: true });
  },

  /** Delete a collection by its id. Returns the deleted doc or null. */
  async deleteById(collectionId: string): Promise<ICollection | null> {
    return Collection.findByIdAndDelete(collectionId);
  },

  /** Add a recipe to a collection (using $addToSet to prevent duplicates at DB level). */
  async addRecipe(collectionId: string, recipeId: string): Promise<ICollection | null> {
    return Collection.findByIdAndUpdate(
      collectionId,
      { $addToSet: { recipes: recipeId } },
      { new: true },
    );
  },

  /** Remove a recipe from a collection. Returns the updated doc or null. */
  async removeRecipe(collectionId: string, recipeId: string): Promise<ICollection | null> {
    return Collection.findByIdAndUpdate(
      collectionId,
      { $pull: { recipes: recipeId } },
      { new: true },
    );
  },
};
