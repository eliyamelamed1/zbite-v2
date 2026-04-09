import api from '../../../api/axios';
import { LeaderboardEntry, PaginatedResponse } from '../../../types';

export const getLeaderboard = (period = 'alltime', page = 1) =>
  api.get<PaginatedResponse<LeaderboardEntry>>(`/leaderboard?period=${period}&page=${page}`);
