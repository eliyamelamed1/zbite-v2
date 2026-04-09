/**
 * Pure utility functions for the social module.
 */

/** Minimum number of ratings before a recipe earns a score. */
const MIN_RATINGS_FOR_SCORE = 3;

/** Precision multiplier for rounding scores to 2 decimal places. */
const SCORE_PRECISION = 100;

/** The neutral star rating — deviations above/below this drive the score. */
const NEUTRAL_RATING = 3;

/**
 * Compute a recipe's score based on its average rating and number of ratings.
 *
 * Formula: ratingsCount × (averageRating - 3) × log₂(1 + ratingsCount)
 *
 * - Recipes with fewer than 3 ratings score 0 (too noisy).
 * - Ratings above 3 stars contribute positively; below 3 contribute negatively.
 * - The log₂ confidence factor rewards well-reviewed recipes without linear scaling.
 */
export function computeRecipeScore(averageRating: number, ratingsCount: number): number {
  if (ratingsCount < MIN_RATINGS_FOR_SCORE) return 0;

  const deviation = averageRating - NEUTRAL_RATING;
  const confidence = Math.log2(1 + ratingsCount);
  return Math.round(ratingsCount * deviation * confidence * SCORE_PRECISION) / SCORE_PRECISION;
}
