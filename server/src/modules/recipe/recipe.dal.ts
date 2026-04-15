import { Types } from 'mongoose';

import Recipe from '../../models/Recipe';
import User from '../../models/User';
import Follow from '../../models/Follow';
import SavedRecipe from '../../models/SavedRecipe';
import CookingReport from '../../models/CookingReport';
import { IRecipe, PaginatedResult } from '../../shared/types';
import { buildPagination } from '../../shared/utils/pagination';
import {
  PREFERENCE_SYSTEM_TAGS,
  FAMILY_FRIENDLY_MIN_SERVINGS,
  MEAL_PREP_MIN_SERVINGS,
} from './recipe.consts';

import type { RecipeCategory, Preference } from './recipe.consts';
import type { CreateRecipeBody, UpdateRecipeBody } from './recipe.schemas';

const AUTHOR_SUMMARY_FIELDS = 'username avatar';
const AUTHOR_DETAIL_FIELDS = 'username avatar bio followersCount';
const QUICK_MEAL_MAX_MINUTES = 30;

/** Sort configuration keyed by the explore feed sort option. */
const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
  trending: { recipeScore: -1, createdAt: -1 },
  topRated: { recipeScore: -1, savesCount: -1 },
  quick: { cookingTime: 1, recipeScore: -1 },
  recent: { createdAt: -1 },
};

interface ExploreFeedOptions {
  page: number;
  limit: number;
  skip: number;
  sort: string;
  tag?: string;
}

interface PersonalizedExploreFeedOptions extends ExploreFeedOptions {
  interests: readonly string[];
}

interface PaginatedFeedOptions {
  page: number;
  limit: number;
  skip: number;
}

interface CategoryRecommendOptions {
  page: number;
  limit: number;
  skip: number;
  category: RecipeCategory;
  minTime?: number;
  maxTime?: number;
  preference?: Preference;
}

interface PantryRecommendOptions {
  page: number;
  limit: number;
  skip: number;
  ingredients: string[];
  maxTime?: number;
}

interface UserUsualsOptions {
  userId: string;
  recipeFilter: Record<string, unknown>;
  limit: number;
}

/** Data Access Layer for recipe-related Mongoose queries. */
export const RecipeDal = {
  /** Create a new recipe document and populate its author. */
  async create(
    data: CreateRecipeBody & { author: string; coverImage: string },
  ): Promise<IRecipe> {
    const recipe = await Recipe.create(data);
    await recipe.populate('author', AUTHOR_SUMMARY_FIELDS);
    return recipe;
  },

  /** Find a recipe by ID with full author details. */
  async findById(id: string): Promise<IRecipe | null> {
    return Recipe.findById(id).populate('author', AUTHOR_DETAIL_FIELDS);
  },

  /** Find a recipe by ID without populating the author (for ownership checks). */
  async findRawById(id: string): Promise<IRecipe | null> {
    return Recipe.findById(id);
  },

  /** Find all recipes by a specific author with pagination. */
  async findByAuthor(
    userId: string,
    options: PaginatedFeedOptions,
  ): Promise<PaginatedResult<IRecipe>> {
    const { page, limit, skip } = options;
    const filter = { author: userId };

    const [data, total] = await Promise.all([
      Recipe.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', AUTHOR_SUMMARY_FIELDS),
      Recipe.countDocuments(filter),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  /** Fetch the explore feed with optional tag and sort filters. Only published recipes. */
  async exploreFeed(options: ExploreFeedOptions): Promise<PaginatedResult<IRecipe>> {
    const { page, limit, skip, sort, tag } = options;
    const filter: Record<string, unknown> = { status: { $ne: 'draft' } };

    if (tag && tag !== 'All') {
      filter.tags = tag;
    }
    if (sort === 'quick') {
      filter.cookingTime = { $lte: QUICK_MEAL_MAX_MINUTES };
    }

    const sortOption = SORT_OPTIONS[sort] ?? SORT_OPTIONS.recent;

    const [data, total] = await Promise.all([
      Recipe.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('author', AUTHOR_SUMMARY_FIELDS),
      Recipe.countDocuments(filter),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  /** Fetch the feed of recipes from authors the user follows. */
  async followingFeed(
    userId: string,
    options: PaginatedFeedOptions,
  ): Promise<PaginatedResult<IRecipe>> {
    const { page, limit, skip } = options;

    const follows = await Follow.find({ follower: userId }).select('following');
    const followingIds = follows.map((follow) => follow.following);

    const filter = { author: { $in: followingIds }, status: { $ne: 'draft' } };

    const [data, total] = await Promise.all([
      Recipe.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', AUTHOR_SUMMARY_FIELDS),
      Recipe.countDocuments(filter),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  /** Update a recipe by ID and return the updated document. */
  async updateById(
    id: string,
    data: UpdateRecipeBody & { coverImage?: string },
  ): Promise<IRecipe | null> {
    return Recipe.findByIdAndUpdate(id, data, { new: true })
      .populate('author', AUTHOR_SUMMARY_FIELDS);
  },

  /** Delete a recipe by its document reference. */
  async deleteById(id: string): Promise<void> {
    await Recipe.findByIdAndDelete(id);
  },

  /** Increment the recipesCount on the author's User document. */
  async incrementRecipesCount(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $inc: { recipesCount: 1 } });
  },

  /** Decrement the recipesCount on the author's User document. */
  async decrementRecipesCount(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $inc: { recipesCount: -1 } });
  },

  /** Find draft recipes by a specific author. */
  async findDraftsByAuthor(
    userId: string,
    options: PaginatedFeedOptions,
  ): Promise<PaginatedResult<IRecipe>> {
    const { page, limit, skip } = options;
    const filter = { author: userId, status: 'draft' };

    const [data, total] = await Promise.all([
      Recipe.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', AUTHOR_SUMMARY_FIELDS),
      Recipe.countDocuments(filter),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  /** Fetch user interests for personalization. Returns empty array if none. */
  async getUserInterests(userId: string): Promise<string[]> {
    const user = await User.findById(userId).select('interests');
    return user?.interests ?? [];
  },

  /** Full-text search across recipe title and description. Sorted by text relevance score. */
  async searchRecipes(
    query: string,
    options: PaginatedFeedOptions,
  ): Promise<PaginatedResult<IRecipe>> {
    const { page, limit, skip } = options;
    const filter = { $text: { $search: query }, status: { $ne: 'draft' } };

    const [data, total] = await Promise.all([
      Recipe.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .populate('author', AUTHOR_SUMMARY_FIELDS),
      Recipe.countDocuments(filter),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  /**
   * Personalized explore feed — shows interest-matching recipes first,
   * then backfills with non-matching recipes to fill the page.
   */
  async personalizedExploreFeed(
    options: PersonalizedExploreFeedOptions,
  ): Promise<PaginatedResult<IRecipe>> {
    const { page, limit, skip, sort, tag, interests } = options;
    const baseFilter: Record<string, unknown> = {};

    if (tag && tag !== 'All') {
      baseFilter.tags = tag;
    }
    if (sort === 'quick') {
      baseFilter.cookingTime = { $lte: QUICK_MEAL_MAX_MINUTES };
    }

    const sortOption = SORT_OPTIONS[sort] ?? SORT_OPTIONS.recent;

    // If a specific tag is selected, interests don't matter — just use that tag
    if (tag && tag !== 'All') {
      return this.exploreFeed(options);
    }

    // Fetch interest-matching recipes first, then non-matching
    const interestFilter = { ...baseFilter, tags: { $in: interests } };
    const nonInterestFilter = { ...baseFilter, tags: { $nin: interests } };

    const [interestCount, nonInterestCount] = await Promise.all([
      Recipe.countDocuments(interestFilter),
      Recipe.countDocuments(nonInterestFilter),
    ]);

    const total = interestCount + nonInterestCount;

    // Determine how many interest-matching recipes to show on this page
    const interestSkip = Math.min(skip, interestCount);
    const interestLimit = Math.min(limit, Math.max(0, interestCount - interestSkip));
    const nonInterestSkip = Math.max(0, skip - interestCount);
    const nonInterestLimit = limit - interestLimit;

    const [interestRecipes, nonInterestRecipes] = await Promise.all([
      interestLimit > 0
        ? Recipe.find(interestFilter)
            .sort(sortOption)
            .skip(interestSkip)
            .limit(interestLimit)
            .populate('author', AUTHOR_SUMMARY_FIELDS)
        : Promise.resolve([]),
      nonInterestLimit > 0
        ? Recipe.find(nonInterestFilter)
            .sort(sortOption)
            .skip(nonInterestSkip)
            .limit(nonInterestLimit)
            .populate('author', AUTHOR_SUMMARY_FIELDS)
        : Promise.resolve([]),
    ]);

    const data = [...interestRecipes, ...nonInterestRecipes];
    return { data, pagination: buildPagination(page, limit, total) };
  },

  /** Find published recipes with overlapping tags, excluding the given recipe. */
  async findRelatedRecipes(recipeId: string, tags: string[], limit: number): Promise<IRecipe[]> {
    return Recipe.find({
      _id: { $ne: new Types.ObjectId(recipeId) },
      status: { $ne: 'draft' },
      tags: { $in: tags },
    })
      .sort({ recipeScore: -1, createdAt: -1 })
      .limit(limit)
      .populate('author', AUTHOR_SUMMARY_FIELDS);
  },

  /**
   * Path A: category-based recommendations.
   * Filters by `cat:<category>` system tag, time range, and optional preference.
   */
  async recommendByCategory(options: CategoryRecommendOptions): Promise<PaginatedResult<IRecipe>> {
    const { page, limit, skip, category, minTime, maxTime, preference } = options;
    const filter: Record<string, unknown> = { status: { $ne: 'draft' } };

    // Category filter via auto-generated system tag
    const systemTagFilters: string[] = [`cat:${category}`];

    // Preference filter
    if (preference) {
      const prefTags = PREFERENCE_SYSTEM_TAGS[preference];
      if (prefTags) {
        systemTagFilters.push(...prefTags);
      }
    }

    filter.systemTags = systemTagFilters.length === 1
      ? systemTagFilters[0]
      : { $all: systemTagFilters };

    // Time range filter
    if (minTime || maxTime) {
      const timeFilter: Record<string, number> = {};
      if (minTime) timeFilter.$gte = minTime;
      if (maxTime) timeFilter.$lte = maxTime;
      filter.cookingTime = timeFilter;
    }

    // Servings-based preferences (not tag-based)
    if (preference === 'family-friendly') {
      filter.servings = { $gte: FAMILY_FRIENDLY_MIN_SERVINGS };
    }
    if (preference === 'meal-prep') {
      filter.servings = { $gte: MEAL_PREP_MIN_SERVINGS };
    }

    const [data, total] = await Promise.all([
      Recipe.find(filter)
        .sort({ recipeScore: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', AUTHOR_SUMMARY_FIELDS),
      Recipe.countDocuments(filter),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  /**
   * Path B: ingredient-based recommendations ("Use What I Have").
   * Scores recipes by how many user ingredients match recipe ingredient names.
   */
  async recommendByIngredients(options: PantryRecommendOptions): Promise<PaginatedResult<IRecipe>> {
    const { page, limit, skip, ingredients, maxTime } = options;

    const matchStage: Record<string, unknown> = { status: { $ne: 'draft' } };
    if (maxTime) {
      matchStage.cookingTime = { $lte: maxTime };
    }

    // Build regex patterns for case-insensitive substring matching
    const regexPatterns = ingredients.map((ing) => new RegExp(ing, 'i'));

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          ingredientMatchCount: {
            $size: {
              $filter: {
                input: '$ingredients',
                as: 'ing',
                cond: {
                  $or: regexPatterns.map((pattern) => ({
                    $regexMatch: { input: '$$ing.name', regex: pattern },
                  })),
                },
              },
            },
          },
        },
      },
      { $match: { ingredientMatchCount: { $gte: 1 } } },
      { $sort: { ingredientMatchCount: -1 as const, recipeScore: -1 as const } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }, { $project: { ingredientMatchCount: 0 } }],
          total: [{ $count: 'count' }],
        },
      },
    ];

    const [result] = await Recipe.aggregate(pipeline);
    const data = result?.data ?? [];
    const total = result?.total?.[0]?.count ?? 0;

    // Populate author on the raw docs
    const populatedData = await Recipe.populate(data, {
      path: 'author',
      select: AUTHOR_SUMMARY_FIELDS,
    }) as unknown as IRecipe[];

    return { data: populatedData, pagination: buildPagination(page, limit, total) };
  },

  /**
   * Find "Your Go-To" recipes — ones the user has previously cooked or saved
   * that also match the current recommendation filters.
   */
  async findUserUsuals(options: UserUsualsOptions): Promise<IRecipe[]> {
    const { userId, recipeFilter, limit: maxResults } = options;

    // Get recipe IDs from cooking reports and saved recipes
    const [cookDocs, saveDocs] = await Promise.all([
      CookingReport.find({ user: userId }).distinct('recipe'),
      SavedRecipe.find({ user: userId }).distinct('recipe'),
    ]);

    const uniqueIds = [...new Set([
      ...cookDocs.map(String),
      ...saveDocs.map(String),
    ])];

    if (uniqueIds.length === 0) return [];

    return Recipe.find({
      _id: { $in: uniqueIds },
      ...recipeFilter,
    })
      .sort({ recipeScore: -1 })
      .limit(maxResults)
      .populate('author', AUTHOR_SUMMARY_FIELDS);
  },

  /** Find "Make It Again" recipes -- previously cooked or saved by the user. */
  async findUserGoToRecipes(userId: string, limit: number): Promise<IRecipe[]> {
    const [cookDocs, saveDocs] = await Promise.all([
      CookingReport.find({ user: userId }).sort({ createdAt: -1 }).distinct('recipe'),
      SavedRecipe.find({ user: userId }).sort({ savedAt: -1 }).distinct('recipe'),
    ]);

    const uniqueIds = [...new Set([...cookDocs.map(String), ...saveDocs.map(String)])];
    if (uniqueIds.length === 0) return [];

    return Recipe.find({ _id: { $in: uniqueIds }, status: { $ne: 'draft' } })
      .sort({ recipeScore: -1 })
      .limit(limit)
      .populate('author', AUTHOR_SUMMARY_FIELDS);
  },

  /** Find published recipes matching a single interest tag, excluding already-shown IDs. */
  async findByInterest(
    interest: string,
    excludeIds: string[],
    limit: number,
  ): Promise<IRecipe[]> {
    return Recipe.find({
      tags: interest,
      status: { $ne: 'draft' },
      _id: { $nin: excludeIds },
    })
      .sort({ recipeScore: -1, createdAt: -1 })
      .limit(limit)
      .populate('author', AUTHOR_SUMMARY_FIELDS);
  },

  /** Find quick recipes (<=30 min) filtered by user interests, excluding already-shown IDs. */
  async findQuickByInterests(
    interests: readonly string[],
    excludeIds: string[],
    limit: number,
  ): Promise<IRecipe[]> {
    const QUICK_MAX_MINUTES = 30;
    const filter: Record<string, unknown> = {
      cookingTime: { $lte: QUICK_MAX_MINUTES },
      status: { $ne: 'draft' },
      _id: { $nin: excludeIds },
    };
    if (interests.length > 0) {
      filter.tags = { $in: interests };
    }
    return Recipe.find(filter)
      .sort({ recipeScore: -1 })
      .limit(limit)
      .populate('author', AUTHOR_SUMMARY_FIELDS);
  },

  /** Find recipes created in the last 7 days. */
  async findNewThisWeek(limit: number): Promise<IRecipe[]> {
    const DAYS_IN_WEEK = 7;
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const weekAgo = new Date(Date.now() - DAYS_IN_WEEK * MS_PER_DAY);
    return Recipe.find({ status: { $ne: 'draft' }, createdAt: { $gte: weekAgo } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', AUTHOR_SUMMARY_FIELDS);
  },

  /** Find generic trending recipes (no personalization). */
  async findTrending(limit: number): Promise<IRecipe[]> {
    return Recipe.find({ status: { $ne: 'draft' } })
      .sort({ recipeScore: -1, createdAt: -1 })
      .limit(limit)
      .populate('author', AUTHOR_SUMMARY_FIELDS);
  },
};
