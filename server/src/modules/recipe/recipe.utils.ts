import { CATEGORY_INGREDIENT_MAP } from './recipe.consts';

import type { RecipeCategory } from './recipe.consts';

/** Threshold constants for system tag computation. */
const MAX_TIME_15 = 15;
const MAX_TIME_30 = 30;
const MAX_TIME_60 = 60;
const MIN_HIGH_PROTEIN = 25;
const MAX_LOW_CALORIE = 300;
const MAX_LOW_CARB = 20;
const MAX_LOW_FAT = 10;
const MAX_FEW_INGREDIENTS = 5;
const MAX_ONE_POT_STEPS = 3;
const MAX_ONE_POT_INGREDIENTS = 8;

interface RecipeData {
  cookingTime: number;
  difficulty: string;
  ingredients: { name: string }[];
  steps: unknown[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

/**
 * Check whether any ingredient name contains a keyword (case-insensitive substring).
 * Returns true on the first match found.
 */
function ingredientsMatchCategory(
  ingredientNames: readonly string[],
  keywords: readonly string[],
): boolean {
  return keywords.some((keyword) =>
    ingredientNames.some((name) => name.includes(keyword)),
  );
}

/**
 * Scan ingredient names and assign `cat:<category>` tags for every matching category.
 * A recipe with "spaghetti" + "ground beef" gets both `cat:pasta` and `cat:beef`.
 */
function computeCategoryTags(ingredientNames: readonly string[]): string[] {
  const categoryTags: string[] = [];

  const categories = Object.keys(CATEGORY_INGREDIENT_MAP) as RecipeCategory[];
  for (const category of categories) {
    const keywords = CATEGORY_INGREDIENT_MAP[category];
    if (ingredientsMatchCategory(ingredientNames, keywords)) {
      categoryTags.push(`cat:${category}`);
    }
  }

  return categoryTags;
}

/**
 * Computes system tags from recipe data.
 * Pure function — no side effects, fully deterministic.
 *
 * Tags include time thresholds, nutrition flags, difficulty, ingredient count,
 * and category auto-tags based on ingredient keyword scanning.
 */
export function computeSystemTags(recipe: RecipeData): string[] {
  const tags: string[] = [];

  // Time-based tags
  if (recipe.cookingTime <= MAX_TIME_15) tags.push('under-15-min');
  if (recipe.cookingTime <= MAX_TIME_30) tags.push('under-30-min');
  if (recipe.cookingTime <= MAX_TIME_60) tags.push('under-60-min');

  // Nutrition-based tags
  if (recipe.nutrition.protein >= MIN_HIGH_PROTEIN) tags.push('high-protein');
  if (recipe.nutrition.calories <= MAX_LOW_CALORIE) tags.push('low-calorie');
  if (recipe.nutrition.carbs <= MAX_LOW_CARB) tags.push('low-carb');
  if (recipe.nutrition.fat <= MAX_LOW_FAT) tags.push('low-fat');

  // Difficulty & complexity tags
  if (recipe.difficulty === 'easy') tags.push('beginner-friendly');
  if (recipe.ingredients.length <= MAX_FEW_INGREDIENTS) tags.push('few-ingredients');

  const isOnePot = recipe.steps.length <= MAX_ONE_POT_STEPS
    && recipe.ingredients.length <= MAX_ONE_POT_INGREDIENTS;
  if (isOnePot) tags.push('one-pot');

  // Category auto-tags from ingredient scanning
  const ingredientNames = recipe.ingredients.map((ing) => ing.name.toLowerCase());
  const categoryTags = computeCategoryTags(ingredientNames);
  tags.push(...categoryTags);

  return tags;
}
