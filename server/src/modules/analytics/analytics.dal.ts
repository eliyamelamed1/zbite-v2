import Recipe from '../../models/Recipe';
import User from '../../models/User';
import Like from '../../models/Like';
import Comment from '../../models/Comment';
import SavedRecipe from '../../models/SavedRecipe';

import type { IRecipe, IUser } from '../../shared/types';

const RECIPE_FIELDS = 'title coverImage likesCount commentsCount savesCount averageRating ratingsCount createdAt';

interface RecipePerformance {
  _id: string;
  title: string;
  coverImage: string;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  averageRating: number;
  ratingsCount: number;
  createdAt: Date;
}

interface OverviewStats {
  totalRecipes: number;
  totalLikes: number;
  totalComments: number;
  totalSaves: number;
  averageRating: number;
  followersCount: number;
}

interface DailyEngagement {
  date: string;
  likes: number;
  comments: number;
  saves: number;
}

/** Data Access Layer for creator analytics queries. */
export const AnalyticsDal = {
  /** Get aggregated overview stats for a creator. */
  async getOverview(userId: string): Promise<OverviewStats> {
    const user = await User.findById(userId).select('followersCount');
    const recipes = await Recipe.find({ author: userId, status: { $ne: 'draft' } })
      .select('likesCount commentsCount savesCount averageRating ratingsCount');

    const totalRecipes = recipes.length;
    const totalLikes = recipes.reduce((sum, r) => sum + (r.likesCount ?? 0), 0);
    const totalComments = recipes.reduce((sum, r) => sum + (r.commentsCount ?? 0), 0);
    const totalSaves = recipes.reduce((sum, r) => sum + (r.savesCount ?? 0), 0);

    const ratedRecipes = recipes.filter((r) => r.ratingsCount > 0);
    const averageRating = ratedRecipes.length > 0
      ? Math.round((ratedRecipes.reduce((sum, r) => sum + r.averageRating, 0) / ratedRecipes.length) * 10) / 10
      : 0;

    return {
      totalRecipes,
      totalLikes,
      totalComments,
      totalSaves,
      averageRating,
      followersCount: user?.followersCount ?? 0,
    };
  },

  /** Get per-recipe performance for a creator, sorted by likes. */
  async getRecipePerformance(userId: string): Promise<RecipePerformance[]> {
    const recipes = await Recipe.find({ author: userId, status: { $ne: 'draft' } })
      .sort({ likesCount: -1 })
      .select(RECIPE_FIELDS)
      .lean();

    return recipes as unknown as RecipePerformance[];
  },

  /** Get daily engagement (likes, comments, saves) for the last N days. */
  async getDailyEngagement(userId: string, days: number): Promise<DailyEngagement[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get all recipe IDs by this user
    const userRecipes = await Recipe.find({ author: userId }).select('_id');
    const recipeIds = userRecipes.map((r) => r._id);

    if (recipeIds.length === 0) return [];

    // Aggregate likes, comments, saves per day
    const [likesPerDay, commentsPerDay, savesPerDay] = await Promise.all([
      Like.aggregate([
        { $match: { recipe: { $in: recipeIds }, createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]),
      Comment.aggregate([
        { $match: { recipe: { $in: recipeIds }, createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]),
      SavedRecipe.aggregate([
        { $match: { recipe: { $in: recipeIds }, savedAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$savedAt' } }, count: { $sum: 1 } } },
      ]),
    ]);

    // Build a map of date → engagement
    const engagementMap = new Map<string, DailyEngagement>();

    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split('T')[0];
      engagementMap.set(key, { date: key, likes: 0, comments: 0, saves: 0 });
    }

    for (const entry of likesPerDay) {
      const existing = engagementMap.get(entry._id);
      if (existing) existing.likes = entry.count;
    }
    for (const entry of commentsPerDay) {
      const existing = engagementMap.get(entry._id);
      if (existing) existing.comments = entry.count;
    }
    for (const entry of savesPerDay) {
      const existing = engagementMap.get(entry._id);
      if (existing) existing.saves = entry.count;
    }

    return Array.from(engagementMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  },
};

export type { OverviewStats, RecipePerformance, DailyEngagement };
