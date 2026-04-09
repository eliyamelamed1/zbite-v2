import { z } from 'zod';

/** Schema for analytics query params (optional date range). */
export const AnalyticsQuerySchema = z.object({
  days: z.string().optional().default('30'),
});
export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
