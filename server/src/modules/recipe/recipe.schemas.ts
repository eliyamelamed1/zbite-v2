import { z } from 'zod';

import { CATEGORIES } from '../../constants/categories';

const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 500;
const MIN_SERVINGS = 1;

const IngredientSchema = z.object({
  name: z.string().min(1),
  amount: z.string().min(1),
});

const StepSchema = z.object({
  order: z.number().int().min(0),
  title: z.string().default(''),
  instruction: z.string().min(1),
  image: z.string().default(''),
});

const NutritionSchema = z.object({
  calories: z.number().min(0).default(0),
  protein: z.number().min(0).default(0),
  carbs: z.number().min(0).default(0),
  fat: z.number().min(0).default(0),
});

/** Schema for the JSON body sent inside the multipart `data` field when creating a recipe. */
export const CreateRecipeBodySchema = z.object({
  title: z.string().min(1).max(TITLE_MAX_LENGTH),
  description: z.string().min(1).max(DESCRIPTION_MAX_LENGTH),
  category: z.enum(CATEGORIES).default('Italian'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  cookingTime: z.number().int().positive(),
  servings: z.number().int().min(MIN_SERVINGS),
  ingredients: z.array(IngredientSchema).min(1),
  steps: z.array(StepSchema).min(1),
  nutrition: NutritionSchema.optional(),
});
export type CreateRecipeBody = z.infer<typeof CreateRecipeBodySchema>;

/** Schema for the JSON body sent inside the multipart `data` field when updating a recipe. */
export const UpdateRecipeBodySchema = CreateRecipeBodySchema.partial();
export type UpdateRecipeBody = z.infer<typeof UpdateRecipeBodySchema>;

/** Schema for route params containing a recipe ID. */
export const RecipeIdParamsSchema = z.object({
  id: z.string().min(1),
});
export type RecipeIdParams = z.infer<typeof RecipeIdParamsSchema>;

/** Schema for route params containing a user ID. */
export const UserIdParamsSchema = z.object({
  userId: z.string().min(1),
});
export type UserIdParams = z.infer<typeof UserIdParamsSchema>;

const EXPLORE_SORT_OPTIONS = ['recent', 'trending', 'topRated', 'quick'] as const;

/** Schema for the explore feed query parameters. */
export const ExploreFeedQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sort: z.enum(EXPLORE_SORT_OPTIONS).optional().default('recent'),
  category: z.string().optional(),
});
export type ExploreFeedQuery = z.infer<typeof ExploreFeedQuerySchema>;

/** Schema for generic paginated query parameters. */
export const PaginationQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
