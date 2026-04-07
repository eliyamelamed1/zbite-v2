import User from '../../models/User';

import type { IUser } from '../../shared/types';

/** Sort configuration per leaderboard period. */
interface LeaderboardSort {
  readonly [key: string]: 1 | -1;
}

const ALLTIME_SORT: LeaderboardSort = { followersCount: -1, recipesCount: -1 };
const RECENT_SORT: LeaderboardSort = { recipesCount: -1, followersCount: -1 };

const USER_SELECT_FIELDS = 'username avatar bio followersCount followingCount recipesCount';

/** Data Access Layer for leaderboard queries. */
export const LeaderboardDal = {
  /**
   * Fetch ranked users who have at least one recipe.
   * Returns paginated users sorted by the appropriate period strategy.
   */
  async findRankedUsers(
    period: string,
    skip: number,
    limit: number,
  ): Promise<{ data: IUser[]; total: number }> {
    const sort = period === 'alltime' ? ALLTIME_SORT : RECENT_SORT;
    const filter = { recipesCount: { $gt: 0 } };

    const [data, total] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select(USER_SELECT_FIELDS),
      User.countDocuments(filter),
    ]);

    return { data, total };
  },
};
