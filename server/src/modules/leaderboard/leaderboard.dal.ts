import User from '../../models/User';
import Recipe from '../../models/Recipe';

import type { IUser } from '../../shared/types';

const DAYS_IN_WEEK = 7;
const DAYS_IN_MONTH = 30;

const USER_SELECT_FIELDS = 'username avatar bio followersCount followingCount recipesCount';

/** Build a Date threshold for period-based filtering. */
function buildDateThreshold(period: string): Date | null {
  if (period === 'weekly') {
    return new Date(Date.now() - DAYS_IN_WEEK * 24 * 60 * 60 * 1000);
  }
  if (period === 'monthly') {
    return new Date(Date.now() - DAYS_IN_MONTH * 24 * 60 * 60 * 1000);
  }
  return null;
}

/** Data Access Layer for leaderboard queries. */
export const LeaderboardDal = {
  /**
   * Fetch ranked users who have at least one recipe.
   *
   * For 'alltime': ranks by followersCount then recipesCount (all users with recipes).
   * For 'weekly'/'monthly': finds users who posted recipes within the time window,
   * ranks by number of recipes posted in that period.
   */
  async findRankedUsers(
    period: string,
    skip: number,
    limit: number,
  ): Promise<{ data: IUser[]; total: number }> {
    const dateThreshold = buildDateThreshold(period);

    // All-time: simple query on User model
    if (!dateThreshold) {
      const filter = { recipesCount: { $gt: 0 } };
      const [data, total] = await Promise.all([
        User.find(filter)
          .sort({ followersCount: -1, recipesCount: -1 })
          .skip(skip)
          .limit(limit)
          .select(USER_SELECT_FIELDS),
        User.countDocuments(filter),
      ]);
      return { data, total };
    }

    // Weekly/Monthly: aggregate recipes created within the time window
    const pipeline = [
      { $match: { createdAt: { $gte: dateThreshold } } },
      { $group: { _id: '$author', periodRecipeCount: { $sum: 1 } } },
      { $sort: { periodRecipeCount: -1 as const } },
      { $count: 'total' },
    ];

    const countResult = await Recipe.aggregate(pipeline);
    const total = countResult[0]?.total ?? 0;

    const rankedAuthors = await Recipe.aggregate([
      { $match: { createdAt: { $gte: dateThreshold } } },
      { $group: { _id: '$author', periodRecipeCount: { $sum: 1 } } },
      { $sort: { periodRecipeCount: -1 as const } },
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
          _id: '$userDoc._id',
          username: '$userDoc.username',
          avatar: '$userDoc.avatar',
          bio: '$userDoc.bio',
          followersCount: '$userDoc.followersCount',
          followingCount: '$userDoc.followingCount',
          recipesCount: '$userDoc.recipesCount',
        },
      },
    ]);

    return { data: rankedAuthors as unknown as IUser[], total };
  },
};
