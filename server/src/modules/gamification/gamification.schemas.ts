import { z } from 'zod';

/** Schema for the POST /cook request body. */
export const RecordCookBodySchema = z.object({
  recipeId: z.string().min(1),
});
export type RecordCookBody = z.infer<typeof RecordCookBodySchema>;

/** Response schema for GET /streaks/me and the streak part of POST /cook. */
export const CookingStreakResponseSchema = z.object({
  _id: z.string(),
  user: z.string(),
  currentStreak: z.number(),
  longestStreak: z.number(),
  totalCooked: z.number(),
  lastCookDate: z.string().nullable(),
});

/** Response schema for POST /cook. */
export const RecordCookResponseSchema = z.object({
  streak: CookingStreakResponseSchema,
  newAchievements: z.array(z.string()),
});

/** Response schema for GET /achievements/me and GET /achievements/:userId. */
export const AchievementResponseSchema = z.array(
  z.object({
    _id: z.string(),
    user: z.string(),
    type: z.string(),
    unlockedAt: z.string(),
  }),
);
