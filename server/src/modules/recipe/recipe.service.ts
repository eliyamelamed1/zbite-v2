import { RecipeDal } from './recipe.dal';
import { SocialDal } from '../social/social.dal';
import Recipe from '../../models/Recipe';
import { NotFoundError, ForbiddenError, ValidationError } from '../../shared/errors';
import { IRecipe, PaginatedResult } from '../../shared/types';
import { saveFile } from '../../plugins/upload';
import { trackActivity } from '../../shared/utils/track-activity';

import type { MultipartFile } from '@fastify/multipart';
import type { RecipeCategory, Preference } from './recipe.consts';
import type { CreateRecipeBody, UpdateRecipeBody } from './recipe.schemas';

/** Response shape for the /home endpoint. */
interface InterestRow {
  interest: string;
  recipes: IRecipe[];
}

interface HomeData {
  recentlyViewed: IRecipe[];
  cookedBefore: IRecipe[];
  goTo: IRecipe[];
  interestRows: InterestRow[];
  quickTonight: IRecipe[];
  trending: IRecipe[];
  newThisWeek: IRecipe[];
}

interface MealSuggestion {
  recipe: IRecipe;
  source: 'saved' | 'interest' | 'popular';
}

/** Fisher-Yates shuffle a copy of the array and return the first `count` items. */
function shuffleAndPick<T>(items: T[], count: number): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

const RECIPES_UPLOAD_FOLDER = 'recipes';
const STEP_IMAGES_UPLOAD_FOLDER = 'recipes/steps';

interface CreateRecipeInput {
  body: CreateRecipeBody;
  authorId: string;
  coverFile: MultipartFile;
  stepImageFiles: MultipartFile[];
  stepImageMap: Record<string, number>;
}

interface UpdateRecipeInput {
  recipeId: string;
  authorId: string;
  body: UpdateRecipeBody;
  coverFile: MultipartFile | null;
  stepImageFiles: MultipartFile[];
  stepImageMap: Record<string, number>;
}

interface FeedOptions {
  page: number;
  limit: number;
  skip: number;
}

interface ExploreFeedOptions extends FeedOptions {
  sort: string;
  tag?: string;
  userId?: string;
}

interface CategoryRecommendOptions extends FeedOptions {
  category: RecipeCategory;
  minTime?: number;
  maxTime?: number;
  preference?: Preference;
  userId?: string;
}

interface PantryRecommendOptions extends FeedOptions {
  ingredients: string[];
  maxTime?: number;
  userId?: string;
}

/** Uploads step images in-place, mutating the steps array with saved URLs. */
async function uploadStepImages(
  steps: CreateRecipeBody['steps'],
  stepImageFiles: MultipartFile[],
  stepImageMap: Record<string, number>,
): Promise<void> {
  const entries = Object.entries(stepImageMap);

  for (const [stepIndex, fileIndex] of entries) {
    const file = stepImageFiles[Number(fileIndex)];

    if (file && steps[Number(stepIndex)]) {
      steps[Number(stepIndex)].image = await saveFile(file, STEP_IMAGES_UPLOAD_FOLDER);
    }
  }
}

/** Recipe business logic -- no HTTP concerns, no direct DB calls. */
export const RecipeService = {
  /** Create a recipe with cover image and optional step images. */
  async createRecipe(input: CreateRecipeInput): Promise<IRecipe> {
    const { body, authorId, coverFile, stepImageFiles, stepImageMap } = input;

    const coverImage = await saveFile(coverFile, RECIPES_UPLOAD_FOLDER);
    await uploadStepImages(body.steps, stepImageFiles, stepImageMap);

    const recipe = await RecipeDal.create({
      ...body,
      author: authorId,
      coverImage,
    });

    // Only increment public recipe count for published recipes (not drafts)
    if (!body.status || body.status === 'published') {
      await RecipeDal.incrementRecipesCount(authorId);
    }
    return recipe;
  },

  /** Get a single recipe by ID. Increments viewsCount. Throws NotFoundError when missing. */
  async getRecipe(recipeId: string, userId?: string): Promise<IRecipe> {
    const recipe = await RecipeDal.findById(recipeId);
    if (!recipe) throw new NotFoundError('Recipe', recipeId);
    // Fire-and-forget view count increment — non-blocking
    Recipe.findByIdAndUpdate(recipeId, { $inc: { viewsCount: 1 } }).catch(() => {});
    if (userId) {
      trackActivity(userId, 'view', recipeId);
    }
    return recipe;
  },

  /** Update a recipe. Only the owner may update. */
  async updateRecipe(input: UpdateRecipeInput): Promise<IRecipe> {
    const { recipeId, authorId, body, coverFile, stepImageFiles, stepImageMap } = input;

    const existing = await RecipeDal.findRawById(recipeId);
    if (!existing) throw new NotFoundError('Recipe', recipeId);
    if (existing.author.toString() !== authorId) {
      throw new ForbiddenError('Not authorized to update this recipe');
    }

    const updateData: UpdateRecipeBody & { coverImage?: string } = { ...body };

    if (coverFile) {
      updateData.coverImage = await saveFile(coverFile, RECIPES_UPLOAD_FOLDER);
    }

    if (updateData.steps) {
      await uploadStepImages(updateData.steps, stepImageFiles, stepImageMap);
    }

    const updated = await RecipeDal.updateById(recipeId, updateData);
    if (!updated) throw new NotFoundError('Recipe', recipeId);
    return updated;
  },

  /** Delete a recipe. Only the owner may delete. */
  async deleteRecipe(recipeId: string, authorId: string): Promise<void> {
    const existing = await RecipeDal.findRawById(recipeId);
    if (!existing) throw new NotFoundError('Recipe', recipeId);
    if (existing.author.toString() !== authorId) {
      throw new ForbiddenError('Not authorized to delete this recipe');
    }

    await RecipeDal.deleteById(recipeId);
    await RecipeDal.decrementRecipesCount(authorId);

    // Recalculate author's chef score after removing a recipe
    const totalChefScore = await SocialDal.sumRecipeScoresByAuthor(authorId);
    await SocialDal.updateUserChefScore(authorId, totalChefScore);
  },

  /** Get the explore feed with optional tag, sort filters, and interest personalization. */
  async getExploreFeed(options: ExploreFeedOptions): Promise<PaginatedResult<IRecipe>> {
    // If authenticated, fetch user interests for personalization
    if (options.userId) {
      const interests = await RecipeDal.getUserInterests(options.userId);
      if (interests.length > 0) {
        return RecipeDal.personalizedExploreFeed({ ...options, interests });
      }
    }
    return RecipeDal.exploreFeed(options);
  },

  /** Get the following feed for a specific user. */
  async getFollowingFeed(
    userId: string,
    options: FeedOptions,
  ): Promise<PaginatedResult<IRecipe>> {
    return RecipeDal.followingFeed(userId, options);
  },

  /** Get draft recipes for the authenticated user. */
  async getDrafts(
    userId: string,
    options: FeedOptions,
  ): Promise<PaginatedResult<IRecipe>> {
    return RecipeDal.findDraftsByAuthor(userId, options);
  },

  /** Search published recipes by title and description using full-text search. */
  async searchRecipes(
    query: string,
    options: FeedOptions,
  ): Promise<PaginatedResult<IRecipe>> {
    return RecipeDal.searchRecipes(query, options);
  },

  /** Get all recipes authored by a specific user. */
  async getUserRecipes(
    userId: string,
    options: FeedOptions,
  ): Promise<PaginatedResult<IRecipe>> {
    return RecipeDal.findByAuthor(userId, options);
  },

  /** Get category-based recommendations (Path A: "Help Me Decide"). */
  async getPickRecommendations(options: CategoryRecommendOptions): Promise<{
    data: IRecipe[];
    usuals: IRecipe[];
    pagination: PaginatedResult<IRecipe>['pagination'];
  }> {
    const { category, minTime, maxTime, preference, userId, ...feedOpts } = options;

    const result = await RecipeDal.recommendByCategory({
      ...feedOpts,
      category,
      minTime,
      maxTime,
      preference,
    });

    // Build filter for usuals query (same constraints as main query)
    let usuals: IRecipe[] = [];
    if (userId) {
      const recipeFilter: Record<string, unknown> = {
        status: { $ne: 'draft' },
        systemTags: `cat:${category}`,
      };
      if (minTime || maxTime) {
        const timeFilter: Record<string, number> = {};
        if (minTime) timeFilter.$gte = minTime;
        if (maxTime) timeFilter.$lte = maxTime;
        recipeFilter.cookingTime = timeFilter;
      }

      const USUALS_LIMIT = 3;
      usuals = await RecipeDal.findUserUsuals({ userId, recipeFilter, limit: USUALS_LIMIT });
    }

    return { data: result.data, usuals, pagination: result.pagination };
  },

  /** Get ingredient-based recommendations (Path B: "Use What I Have"). */
  async getPantryRecommendations(options: PantryRecommendOptions): Promise<{
    data: IRecipe[];
    usuals: IRecipe[];
    pagination: PaginatedResult<IRecipe>['pagination'];
  }> {
    const { ingredients, maxTime, userId, ...feedOpts } = options;

    const result = await RecipeDal.recommendByIngredients({
      ...feedOpts,
      ingredients,
      maxTime,
    });

    let usuals: IRecipe[] = [];
    if (userId) {
      const recipeFilter: Record<string, unknown> = { status: { $ne: 'draft' } };
      if (maxTime) {
        recipeFilter.cookingTime = { $lte: maxTime };
      }

      const USUALS_LIMIT = 3;
      usuals = await RecipeDal.findUserUsuals({ userId, recipeFilter, limit: USUALS_LIMIT });
    }

    return { data: result.data, usuals, pagination: result.pagination };
  },

  /** Get related recipes that share tags with the given recipe. */
  async getRelatedRecipes(recipeId: string, limit: number): Promise<IRecipe[]> {
    const recipe = await RecipeDal.findById(recipeId);
    if (!recipe) throw new NotFoundError('Recipe', recipeId);
    if (!recipe.tags || recipe.tags.length === 0) return [];
    return RecipeDal.findRelatedRecipes(recipeId, recipe.tags, limit);
  },

  /**
   * Get meal suggestions based on time of day. Returns 3 recipes with source labels.
   * Priority: saved > interest-matched > popular fallback.
   * Shuffles top candidates to avoid repetitive suggestions.
   */
  async getMealSuggestions(mealType: string, userId?: string): Promise<MealSuggestion[]> {
    const CANDIDATE_POOL_SIZE = 20;
    const RESULT_COUNT = 3;
    const candidates: MealSuggestion[] = [];
    const shownIds: string[] = [];

    // Tier 1: user's saved recipes matching meal type
    if (userId) {
      const saved = await RecipeDal.findSavedByMealType(userId, mealType, CANDIDATE_POOL_SIZE);
      for (const recipe of saved) {
        candidates.push({ recipe, source: 'saved' });
        shownIds.push(recipe._id.toString());
      }
    }

    // Tier 2: interest-matched recipes
    if (userId && candidates.length < CANDIDATE_POOL_SIZE) {
      const interests = await RecipeDal.getUserInterests(userId);
      if (interests.length > 0) {
        const remaining = CANDIDATE_POOL_SIZE - candidates.length;
        const interestMatches = await RecipeDal.findByMealTypeAndInterests(mealType, interests, shownIds, remaining);
        for (const recipe of interestMatches) {
          candidates.push({ recipe, source: 'interest' });
          shownIds.push(recipe._id.toString());
        }
      }
    }

    // Tier 3: popular fallback
    if (candidates.length < CANDIDATE_POOL_SIZE) {
      const remaining = CANDIDATE_POOL_SIZE - candidates.length;
      const popular = await RecipeDal.findPopularByMealType(mealType, shownIds, remaining);
      for (const recipe of popular) {
        candidates.push({ recipe, source: 'popular' });
      }
    }

    // Shuffle and pick top 3
    return shuffleAndPick(candidates, RESULT_COUNT);
  },

  /** Build personalized home page data. Falls back to generic sections for guests. */
  async getHomeData(userId?: string): Promise<HomeData> {
    const HOME_SECTION_LIMIT = 4;
    const GO_TO_LIMIT = 6;
    const ACTIVITY_ROW_LIMIT = 6;
    const INTEREST_ROWS_COUNT = 2;

    // Always fetch generic sections
    const [trending, newThisWeek] = await Promise.all([
      RecipeDal.findTrending(HOME_SECTION_LIMIT),
      RecipeDal.findNewThisWeek(HOME_SECTION_LIMIT),
    ]);

    // Guest path -- no personalization
    if (!userId) {
      const quickTonight = await RecipeDal.findQuickByInterests([], [], HOME_SECTION_LIMIT);
      return { recentlyViewed: [], cookedBefore: [], goTo: [], interestRows: [], quickTonight, trending, newThisWeek };
    }

    // Authenticated path -- personalized sections
    const [recentlyViewed, goTo, interests] = await Promise.all([
      RecipeDal.findRecentlyViewed(userId, [], ACTIVITY_ROW_LIMIT),
      RecipeDal.findUserGoToRecipes(userId, GO_TO_LIMIT),
      RecipeDal.getUserInterests(userId),
    ]);

    const shownIds = [
      ...recentlyViewed.map((r) => r._id.toString()),
      ...goTo.map((r) => r._id.toString()),
    ];

    const cookedBefore = await RecipeDal.findCookedBefore(userId, shownIds, ACTIVITY_ROW_LIMIT);
    cookedBefore.forEach((r) => shownIds.push(r._id.toString()));

    // Build interest rows from the user's top interests
    const topInterests = interests.slice(0, INTEREST_ROWS_COUNT);
    const interestRows: InterestRow[] = [];
    for (const interest of topInterests) {
      const recipes = await RecipeDal.findByInterest(interest, shownIds, HOME_SECTION_LIMIT);
      if (recipes.length > 0) {
        interestRows.push({ interest, recipes });
        recipes.forEach((r) => shownIds.push(r._id.toString()));
      }
    }

    const quickTonight = await RecipeDal.findQuickByInterests(interests, shownIds, HOME_SECTION_LIMIT);

    return { recentlyViewed, cookedBefore, goTo, interestRows, quickTonight, trending, newThisWeek };
  },
};
