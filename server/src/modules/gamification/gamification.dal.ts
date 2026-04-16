import CookingStreak from '../../models/CookingStreak';
import Achievement from '../../models/Achievement';

import type { ICookingStreak } from '../../models/CookingStreak';
import type { IAchievement } from '../../models/Achievement';

/** Data Access Layer for all gamification Mongoose queries. */
export const GamificationDal = {
  // -------------------------------------------------------------------------
  // Cooking Streaks
  // -------------------------------------------------------------------------

  /** Find an existing streak record for a user, or return null. */
  async findStreakByUser(userId: string): Promise<ICookingStreak | null> {
    return CookingStreak.findOne({ user: userId });
  },

  /** Find or create the streak record for a user. */
  async findOrCreateStreak(userId: string): Promise<ICookingStreak> {
    const existing = await CookingStreak.findOne({ user: userId });
    if (existing) return existing;

    return CookingStreak.create({ user: userId });
  },

  /** Update streak fields atomically. Returns the updated doc. */
  async updateStreak(
    userId: string,
    fields: Partial<Pick<ICookingStreak, 'currentStreak' | 'longestStreak' | 'lastCookDate' | 'totalCooked'>>,
  ): Promise<ICookingStreak | null> {
    return CookingStreak.findOneAndUpdate(
      { user: userId },
      { $set: fields },
      { new: true },
    );
  },

  // -------------------------------------------------------------------------
  // Achievements
  // -------------------------------------------------------------------------

  /** Find all achievements for a user, sorted by unlock date. */
  async findAchievementsByUser(userId: string): Promise<IAchievement[]> {
    return Achievement.find({ user: userId }).sort({ unlockedAt: -1 });
  },

  /** Check whether a specific achievement type is already unlocked for a user. */
  async hasAchievement(userId: string, type: string): Promise<boolean> {
    const existing = await Achievement.findOne({ user: userId, type });
    return existing !== null;
  },

  /** Create a new achievement record. Returns null if it already exists (duplicate key). */
  async createAchievement(userId: string, type: string): Promise<IAchievement | null> {
    try {
      return await Achievement.create({ user: userId, type });
    } catch (error: unknown) {
      // Duplicate key error (unique index on user + type) — achievement already exists
      const MONGO_DUPLICATE_KEY_CODE = 11000;
      if ((error as Record<string, unknown>).code === MONGO_DUPLICATE_KEY_CODE) return null;
      throw error;
    }
  },
};
