import { z } from 'zod';

const VALID_PERIODS = ['alltime', 'weekly', 'monthly'] as const;

/** Schema for leaderboard query params. */
export const LeaderboardQuerySchema = z.object({
  period: z.enum(VALID_PERIODS).optional().default('alltime'),
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type LeaderboardQuery = z.infer<typeof LeaderboardQuerySchema>;
