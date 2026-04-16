import { CollectionDal } from './collection.dal';
import { NotFoundError, ForbiddenError, ConflictError } from '../../shared/errors';

import type { ICollection } from '../../models/Collection';
import type { CreateCollectionBody, UpdateCollectionBody } from './collection.schemas';

// ---------------------------------------------------------------------------
// Service — business logic with NO HTTP concerns
// ---------------------------------------------------------------------------

/** Verify the collection exists and belongs to the requesting user. */
async function getOwnedCollection(collectionId: string, userId: string): Promise<ICollection> {
  const collection = await CollectionDal.findById(collectionId);
  if (!collection) throw new NotFoundError('Collection', collectionId);
  if (collection.owner.toString() !== userId) throw new ForbiddenError();

  return collection;
}

/** Collection service — orchestrates all collection actions. */
export const CollectionService = {
  /** List all collections owned by the user. */
  async listCollections(userId: string): Promise<ICollection[]> {
    return CollectionDal.findByOwner(userId);
  },

  /** Get a single collection with populated recipes. Only the owner can access. */
  async getCollection(collectionId: string, userId: string): Promise<ICollection> {
    await getOwnedCollection(collectionId, userId);
    const populated = await CollectionDal.findByIdWithRecipes(collectionId);

    // safe: we just verified it exists above
    return populated!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
  },

  /** Create a new collection for the user. */
  async createCollection(userId: string, data: CreateCollectionBody): Promise<ICollection> {
    return CollectionDal.create(userId, data);
  },

  /** Update name/description of a collection. Only the owner can update. */
  async updateCollection(collectionId: string, userId: string, data: UpdateCollectionBody): Promise<ICollection> {
    await getOwnedCollection(collectionId, userId);
    const updated = await CollectionDal.update(collectionId, data);

    // safe: we just verified it exists above
    return updated!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
  },

  /** Delete a collection. Only the owner can delete. */
  async deleteCollection(collectionId: string, userId: string): Promise<void> {
    await getOwnedCollection(collectionId, userId);
    await CollectionDal.deleteById(collectionId);
  },

  /** Add a recipe to a collection. Prevents duplicates. */
  async addRecipe(collectionId: string, recipeId: string, userId: string): Promise<ICollection> {
    const collection = await getOwnedCollection(collectionId, userId);

    const isAlreadyAdded = collection.recipes.some(
      (existingRecipeId) => existingRecipeId.toString() === recipeId,
    );
    if (isAlreadyAdded) throw new ConflictError('Recipe in collection', recipeId);

    const updated = await CollectionDal.addRecipe(collectionId, recipeId);

    // safe: we just verified it exists above
    return updated!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
  },

  /** Remove a recipe from a collection. Only the owner can modify. */
  async removeRecipe(collectionId: string, recipeId: string, userId: string): Promise<ICollection> {
    await getOwnedCollection(collectionId, userId);
    const updated = await CollectionDal.removeRecipe(collectionId, recipeId);

    // safe: we just verified it exists above
    return updated!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
  },
};
