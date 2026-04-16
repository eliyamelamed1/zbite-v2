import { z } from 'zod';

// ---------------------------------------------------------------------------
// Param schemas (route params)
// ---------------------------------------------------------------------------

const COLLECTION_NAME_MAX_LENGTH = 100;
const COLLECTION_DESCRIPTION_MAX_LENGTH = 300;

/** Schema for routes that require a collection id param. */
export const CollectionIdParamsSchema = z.object({
  id: z.string().min(1),
});
export type CollectionIdParams = z.infer<typeof CollectionIdParamsSchema>;

/** Schema for routes that require both collection id and recipe id params. */
export const CollectionRecipeParamsSchema = z.object({
  id: z.string().min(1),
  recipeId: z.string().min(1),
});
export type CollectionRecipeParams = z.infer<typeof CollectionRecipeParamsSchema>;

// ---------------------------------------------------------------------------
// Body schemas
// ---------------------------------------------------------------------------

/** Schema for creating a new collection. */
export const CreateCollectionBodySchema = z.object({
  name: z.string().min(1).max(COLLECTION_NAME_MAX_LENGTH),
  description: z.string().max(COLLECTION_DESCRIPTION_MAX_LENGTH).optional(),
});
export type CreateCollectionBody = z.infer<typeof CreateCollectionBodySchema>;

/** Schema for updating an existing collection. */
export const UpdateCollectionBodySchema = z.object({
  name: z.string().min(1).max(COLLECTION_NAME_MAX_LENGTH).optional(),
  description: z.string().max(COLLECTION_DESCRIPTION_MAX_LENGTH).optional(),
});
export type UpdateCollectionBody = z.infer<typeof UpdateCollectionBodySchema>;
