import User from '../../models/User';
import Recipe from '../../models/Recipe';

import type { IUser } from '../../shared/types';

const DAYS_IN_WEEK = 7;
const DAYS_IN_MONTH = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const USER_SELECT_FIELDS = 'username avatar bio followersCount followingCount recipesCount chefScore';

/** A ranked entry returned from the DAL, pairing a user with their score. */
export interface RankedEntry {
  readonly user: IUser;
  readonly score: number;
}

/** Build a Date threshold for period-based filtering. */
function buildDateThreshold(period: string): Date | null {
  if (period === 'weekly') {
    return new Date(Date.now() - DAYS_IN_WEEK * MS_PER_DAY);
  }
  if (period === 'monthly') {
    return new Date(Date.now() - DAYS_IN_MONTH * MS_PER_DAY);
  }
  return null;
}

/** Data Access Layer for leaderboard queries. */
export const LeaderboardDal = {
  /**
   * Fetch ranked users who have at least one recipe.
   *
   * For 'alltime': ranks by chefScore then recipesCount.
   * For 'weekly'/'monthly': sums recipeScore for recipes created within
   * the time window and ranks by that period score.
   */
  async findRankedUsers(
    period: string,
    skip: number,
    limit: number,
  ): Promise<{ data: RankedEntry[]; total: number }> {
    const dateThreshold = buildDateThreshold(period);

    // All-time: simple query on User model, sorted by chefScore
    if (!dateThreshold) {
      const filter = { recipesCount: { $gt: 0 } };
      const [users, total] = await Promise.all([
        User.find(filter)
          .sort({ chefScore: -1, recipesCount: -1 })
          .skip(skip)
          .limit(limit)
          .select(USER_SELECT_FIELDS),
        User.countDocuments(filter),
      ]);

      const data: RankedEntry[] = users.map((user) => ({
        user,
        score: user.chefScore ?? 0,
      }));

      return { data, total };
    }

    // Weekly/Monthly: aggregate recipes created within the time window, sum recipeScore
    const countResult = await Recipe.aggregate([
      { $match: { createdAt: { $gte: dateThreshold } } },
      { $group: { _id: '$author', periodScore: { $sum: '$recipeScore' } } },
      { $count: 'total' },
    ]);
    const total = countResult[0]?.total ?? 0;

    const rankedAuthors = await Recipe.aggregate([
      { $match: { createdAt: { $gte: dateThreshold } } },
      {
        $group: {
          _id: '$author',
          periodScore: { $sum: '$recipeScore' },
          periodRecipeCount: { $sum: 1 },
        },
      },
      { $sort: { periodScore: -1 as const, periodRecipeCount: -1 as const } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDoc',
        },
      },
      { $unwind: '$userDoc' },
      {
        $project: {
          user: {
            _id: '$userDoc._id',
            username: '$userDoc.username',
            avatar: '$userDoc.avatar',
            bio: '$userDoc.bio',
            followersCount: '$userDoc.followersCount',
            followingCount: '$userDoc.followingCount',
            recipesCount: '$userDoc.recipesCount',
            chefScore: '$userDoc.chefScore',
          },
          score: '$periodScore',
        },
      },
    ]);

    return { data: rankedAuthors as unknown as RankedEntry[], total };
  },
};
