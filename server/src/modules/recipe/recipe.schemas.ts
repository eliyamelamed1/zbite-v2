import { z } from 'zod';

import { ALL_TAGS, MEAL_TYPE_TAGS } from '../../constants/tags';
import { VALID_CATEGORIES, VALID_PREFERENCES } from './recipe.consts';

const MAX_MEAL_TYPE_TAGS = 2;
const mealTypeSet = new Set<string>(MEAL_TYPE_TAGS);

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
  tags: z.array(z.string().refine((t) => (ALL_TAGS as readonly string[]).includes(t)))
    .min(1)
    .max(7)
    .superRefine((tags, ctx) => {
      const mealTagCount = tags.filter((t) => mealTypeSet.has(t)).length;
      if (mealTagCount > MAX_MEAL_TYPE_TAGS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `At most ${MAX_MEAL_TYPE_TAGS} meal-type tags allowed, got ${mealTagCount}`,
        });
      }
    }),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  cookingTime: z.number().int().positive(),
  servings: z.number().int().min(MIN_SERVINGS),
  ingredients: z.array(IngredientSchema).min(1),
  steps: z.array(StepSchema).min(1),
  nutrition: NutritionSchema.optional(),
  status: z.enum(['draft', 'published']).optional().default('published'),
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
  tag: z.string().optional(),
});
export type ExploreFeedQuery = z.infer<typeof ExploreFeedQuerySchema>;

/** Schema for generic paginated query parameters. */
export const PaginationQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

const SEARCH_QUERY_MIN_LENGTH = 1;
const SEARCH_QUERY_MAX_LENGTH = 100;

/** Schema for the recipe search query parameters. */
export const SearchRecipesQuerySchema = z.object({
  q: z.string().min(SEARCH_QUERY_MIN_LENGTH).max(SEARCH_QUERY_MAX_LENGTH),
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type SearchRecipesQuery = z.infer<typeof SearchRecipesQuerySchema>;

/** Schema for category-based recommendations (Path A: "Help Me Decide"). */
export const PickRecommendQuerySchema = z.object({
  mode: z.literal('pick'),
  category: z.enum(VALID_CATEGORIES),
  minTime: z.coerce.number().int().nonnegative().optional(),
  maxTime: z.coerce.number().int().positive().optional(),
  preference: z.enum(VALID_PREFERENCES).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type PickRecommendQuery = z.infer<typeof PickRecommendQuerySchema>;

/** Schema for ingredient-based recommendations (Path B: "Use What I Have"). */
export const PantryRecommendQuerySchema = z.object({
  mode: z.literal('pantry'),
  ingredients: z.string().transform((s) => s.split(',').map((i) => i.trim().toLowerCase()).filter(Boolean)),
  maxTime: z.coerce.number().int().positive().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type PantryRecommendQuery = z.infer<typeof PantryRecommendQuerySchema>;

/** Union schema — dispatches based on the `mode` query param. */
export const RecommendQuerySchema = z.discriminatedUnion('mode', [
  PickRecommendQuerySchema,
  PantryRecommendQuerySchema,
]);
export type RecommendQuery = z.infer<typeof RecommendQuerySchema>;

const MEAL_TYPES = ['Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Snack'] as const;

/** Schema for the meal suggestion query param. */
export const MealSuggestionQuerySchema = z.object({
  mealType: z.enum(MEAL_TYPES),
});
export type MealSuggestionQuery = z.infer<typeof MealSuggestionQuerySchema>;
