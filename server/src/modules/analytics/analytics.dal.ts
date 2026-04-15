import Recipe from '../../models/Recipe';
import User from '../../models/User';
import Comment from '../../models/Comment';
import SavedRecipe from '../../models/SavedRecipe';

import type { IUser } from '../../shared/types';

const RECIPE_FIELDS = 'title coverImage commentsCount savesCount reportsCount recipeScore createdAt';

interface RecipePerformance {
  _id: string;
  title: string;
  coverImage: string;
  commentsCount: number;
  savesCount: number;
  reportsCount: number;
  recipeScore: number;
  createdAt: Date;
}

interface OverviewStats {
  totalRecipes: number;
  totalComments: number;
  totalSaves: number;
  totalCooks: number;
  recipeScore: number;
  followersCount: number;
}

interface DailyEngagement {
  date: string;
  comments: number;
  saves: number;
}

/** Data Access Layer for creator analytics queries. */
export const AnalyticsDal = {
  /** Get aggregated overview stats for a creator. */
  async getOverview(userId: string): Promise<OverviewStats> {
    const user = await User.findById(userId).select('followersCount');
    const recipes = await Recipe.find({ author: userId, status: { $ne: 'draft' } })
      .select('commentsCount savesCount reportsCount recipeScore');

    const totalRecipes = recipes.length;
    const totalComments = recipes.reduce((sum, r) => sum + (r.commentsCount ?? 0), 0);
    const totalSaves = recipes.reduce((sum, r) => sum + (r.savesCount ?? 0), 0);
    const totalCooks = recipes.reduce((sum, r) => sum + (r.reportsCount ?? 0), 0);
    const recipeScore = recipes.reduce((sum, r) => sum + (r.recipeScore ?? 0), 0);

    return {
      totalRecipes,
      totalComments,
      totalSaves,
      totalCooks,
      recipeScore,
      followersCount: (user as IUser | null)?.followersCount ?? 0,
    };
  },

  /** Get per-recipe performance for a creator, sorted by score. */
  async getRecipePerformance(userId: string): Promise<RecipePerformance[]> {
    const recipes = await Recipe.find({ author: userId, status: { $ne: 'draft' } })
      .sort({ recipeScore: -1 })
      .select(RECIPE_FIELDS)
      .lean();

    return recipes as unknown as RecipePerformance[];
  },

  /** Get daily engagement (comments, saves) for the last N days. */
  async getDailyEngagement(userId: string, days: number): Promise<DailyEngagement[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const userRecipes = await Recipe.find({ author: userId }).select('_id');
    const recipeIds = userRecipes.map((r) => r._id);

    if (recipeIds.length === 0) return [];

    const [commentsPerDay, savesPerDay] = await Promise.all([
      Comment.aggregate([
        { $match: { recipe: { $in: recipeIds }, createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]),
      SavedRecipe.aggregate([
        { $match: { recipe: { $in: recipeIds }, savedAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$savedAt' } }, count: { $sum: 1 } } },
      ]),
    ]);

    const engagementMap = new Map<string, DailyEngagement>();

    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split('T')[0];
      engagementMap.set(key, { date: key, comments: 0, saves: 0 });
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
