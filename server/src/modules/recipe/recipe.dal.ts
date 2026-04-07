import { Types } from 'mongoose';

import Recipe from '../../models/Recipe';
import User from '../../models/User';
import Follow from '../../models/Follow';
import { IRecipe, PaginatedResult } from '../../shared/types';
import { buildPagination } from '../../shared/utils/pagination';

import type { CreateRecipeBody, UpdateRecipeBody } from './recipe.schemas';

const AUTHOR_SUMMARY_FIELDS = 'username avatar';
const AUTHOR_DETAIL_FIELDS = 'username avatar bio followersCount';
const QUICK_MEAL_MAX_MINUTES = 30;

/** Sort configuration keyed by the explore feed sort option. */
const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
  trending: { likesCount: -1, averageRating: -1 },
  topRated: { averageRating: -1, ratingsCount: -1 },
  quick: { averageRating: -1 },
  recent: { createdAt: -1 },
};

interface ExploreFeedOptions {
  page: number;
  limit: number;
  skip: number;
  sort: string;
  category?: string;
}

interface PaginatedFeedOptions {
  page: number;
  limit: number;
  skip: number;
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

  /** Fetch the explore feed with optional category and sort filters. */
  async exploreFeed(options: ExploreFeedOptions): Promise<PaginatedResult<IRecipe>> {
    const { page, limit, skip, sort, category } = options;
    const filter: Record<string, unknown> = {};

    if (category && category !== 'All') {
      filter.category = category;
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

    const filter = { author: { $in: followingIds } };

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
};
