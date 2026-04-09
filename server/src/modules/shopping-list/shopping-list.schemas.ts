import { z } from 'zod';

// ---------------------------------------------------------------------------
// Param schemas (route params)
// ---------------------------------------------------------------------------

/** Schema for routes that require a recipeId param. */
export const AddRecipeParamsSchema = z.object({
  recipeId: z.string().min(1),
});
export type AddRecipeParams = z.infer<typeof AddRecipeParamsSchema>;

/** Schema for routes that require an itemId param. */
export const ItemIdParamsSchema = z.object({
  itemId: z.string().min(1),
});
export type ItemIdParams = z.infer<typeof ItemIdParamsSchema>;

// ---------------------------------------------------------------------------
// Body schemas
// ---------------------------------------------------------------------------

/** Schema for toggling an item's checked state. */
export const ToggleItemBodySchema = z.object({
  isChecked: z.boolean(),
});
export type ToggleItemBody = z.infer<typeof ToggleItemBodySchema>;
