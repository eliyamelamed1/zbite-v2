import { LeaderboardDal } from './leaderboard.dal';
import { buildPagination } from '../../shared/utils/pagination';

import type { IUser, PaginatedResult } from '../../shared/types';

/** A leaderboard entry wrapping a user with their rank position. */
interface RankedUser {
  readonly rank: number;
  readonly user: IUser;
}

/** Leaderboard service — ranks users by social engagement metrics. */
export const LeaderboardService = {
  /** Fetch the ranked leaderboard with pagination. */
  async getLeaderboard(
    period: string,
    page: number,
    limit: number,
    skip: number,
  ): Promise<PaginatedResult<RankedUser>> {
    const { data, total } = await LeaderboardDal.findRankedUsers(period, skip, limit);

    const ranked: RankedUser[] = data.map((user, index) => ({
      rank: skip + index + 1,
      user,
    }));

    return { data: ranked, pagination: buildPagination(page, limit, total) };
  },
};
