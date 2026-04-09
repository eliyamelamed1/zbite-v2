import { GamificationDal } from './gamification.dal';

import type { ICookingStreak } from '../../models/CookingStreak';
import type { IAchievement } from '../../models/Achievement';

// ---------------------------------------------------------------------------
// Service — business logic with NO HTTP concerns
// ---------------------------------------------------------------------------

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const TWO_DAYS_MS = 2 * ONE_DAY_MS;

// Achievement thresholds — named constants to avoid magic numbers
const FIRST_COOK_THRESHOLD = 1;
const RECIPES_10_THRESHOLD = 10;
const RECIPES_50_THRESHOLD = 50;
const WEEK_STREAK_THRESHOLD = 7;
const MONTH_STREAK_THRESHOLD = 30;

/** Check whether the gap between two dates is within one calendar day. */
function isConsecutiveDay(lastDate: Date, now: Date): boolean {
  const gap = now.getTime() - lastDate.getTime();
  return gap > 0 && gap < TWO_DAYS_MS;
}

/** Check whether two dates fall on the same calendar day (UTC). */
function isSameDay(dateA: Date, dateB: Date): boolean {
  return (
    dateA.getUTCFullYear() === dateB.getUTCFullYear() &&
    dateA.getUTCMonth() === dateB.getUTCMonth() &&
    dateA.getUTCDate() === dateB.getUTCDate()
  );
}

/** Evaluate which achievements the user has earned and unlock any new ones. */
async function evaluateAchievements(userId: string, streak: ICookingStreak): Promise<void> {
  const checks: Array<{ type: string; isEarned: boolean }> = [
    { type: 'first_cook', isEarned: streak.totalCooked >= FIRST_COOK_THRESHOLD },
    { type: '10_recipes', isEarned: streak.totalCooked >= RECIPES_10_THRESHOLD },
    { type: '50_recipes', isEarned: streak.totalCooked >= RECIPES_50_THRESHOLD },
    { type: 'week_streak', isEarned: streak.currentStreak >= WEEK_STREAK_THRESHOLD },
    { type: 'month_streak', isEarned: streak.currentStreak >= MONTH_STREAK_THRESHOLD },
  ];

  const unlockPromises = checks
    .filter((check) => check.isEarned)
    .map((check) => GamificationDal.createAchievement(userId, check.type));

  await Promise.all(unlockPromises);
}

/** Gamification service — orchestrates streak tracking and achievement unlocking. */
export const GamificationService = {
  /** Return the user's streak data, creating a record if none exists. */
  async getStreak(userId: string): Promise<ICookingStreak> {
    return GamificationDal.findOrCreateStreak(userId);
  },

  /** Return all unlocked achievements for the user. */
  async getAchievements(userId: string): Promise<IAchievement[]> {
    return GamificationDal.findAchievementsByUser(userId);
  },

  /** Record a cook: increment total, update streak, and check achievements. */
  async recordCook(userId: string): Promise<ICookingStreak> {
    const streak = await GamificationDal.findOrCreateStreak(userId);
    const now = new Date();

    // If already cooked today, return existing streak without double-counting
    if (streak.lastCookDate && isSameDay(streak.lastCookDate, now)) {
      return streak;
    }

    const newTotalCooked = streak.totalCooked + 1;
    const isConsecutive = streak.lastCookDate && isConsecutiveDay(streak.lastCookDate, now);
    const newCurrentStreak = isConsecutive ? streak.currentStreak + 1 : 1;
    const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

    const updated = await GamificationDal.updateStreak(userId, {
      totalCooked: newTotalCooked,
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastCookDate: now,
    });

    // safe: we just created/updated this document
    const updatedStreak = updated!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

    await evaluateAchievements(userId, updatedStreak);

    return updatedStreak;
  },
};
