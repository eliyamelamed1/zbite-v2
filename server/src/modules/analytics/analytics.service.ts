import { AnalyticsDal } from './analytics.dal';

import type { OverviewStats, RecipePerformance, DailyEngagement } from './analytics.dal';

/** Analytics service — creator engagement metrics. */
export const AnalyticsService = {
  /** Get aggregated overview stats for the authenticated creator. */
  async getOverview(userId: string): Promise<OverviewStats> {
    return AnalyticsDal.getOverview(userId);
  },

  /** Get per-recipe performance sorted by engagement. */
  async getRecipePerformance(userId: string): Promise<RecipePerformance[]> {
    return AnalyticsDal.getRecipePerformance(userId);
  },

  /** Get daily engagement time-series for the last N days. */
  async getDailyEngagement(userId: string, days: number): Promise<DailyEngagement[]> {
    return AnalyticsDal.getDailyEngagement(userId, days);
  },
};
