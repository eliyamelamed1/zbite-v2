import { RecipeDal } from './recipe.dal';
import Recipe from '../../models/Recipe';
import { NotFoundError, ForbiddenError, ValidationError } from '../../shared/errors';
import { IRecipe, PaginatedResult } from '../../shared/types';
import { saveFile } from '../../plugins/upload';

import type { MultipartFile } from '@fastify/multipart';
import type { CreateRecipeBody, UpdateRecipeBody } from './recipe.schemas';

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
  category?: string;
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
  async getRecipe(recipeId: string): Promise<IRecipe> {
    const recipe = await RecipeDal.findById(recipeId);
    if (!recipe) throw new NotFoundError('Recipe', recipeId);
    // Fire-and-forget view count increment — non-blocking
    Recipe.findByIdAndUpdate(recipeId, { $inc: { viewsCount: 1 } }).catch(() => {});
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
  },

  /** Get the explore feed with optional category, sort filters, and interest personalization. */
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

  /** Get all recipes authored by a specific user. */
  async getUserRecipes(
    userId: string,
    options: FeedOptions,
  ): Promise<PaginatedResult<IRecipe>> {
    return RecipeDal.findByAuthor(userId, options);
  },
};
