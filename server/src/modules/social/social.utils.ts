/**
 * Pure utility functions for the social module.
 */

/** Weight for each save — user wants to cook this recipe. */
const SAVE_WEIGHT = 2;

/** Weight for each comment — active engagement. */
const COMMENT_WEIGHT = 1.5;

/** Weight for each cooking report — strongest signal of recipe value. */
const COOK_WEIGHT = 3;

/** Precision multiplier for rounding scores to 2 decimal places. */
const SCORE_PRECISION = 100;

interface EngagementCounts {
  savesCount: number;
  commentsCount: number;
  reportsCount: number;
}

/**
 * Compute a recipe's score based on engagement signals.
 *
 * Formula: saves×2 + comments×1.5 + cooks×3
 *
 * - Saves indicate intent to cook (moderate signal).
 * - Comments show active engagement.
 * - Cooking reports are the strongest signal — someone actually made the dish.
 */
export function computeRecipeScore(counts: EngagementCounts): number {
  const raw =
    counts.savesCount * SAVE_WEIGHT +
    counts.commentsCount * COMMENT_WEIGHT +
    counts.reportsCount * COOK_WEIGHT;

  return Math.round(raw * SCORE_PRECISION) / SCORE_PRECISION;
}
