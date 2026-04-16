/**
 * TheMealDB → zbite recipe fetcher.
 *
 * Fetches all available meals from TheMealDB (free API), transforms each
 * to our recipe schema, and writes the result to `data/recipes.json`.
 *
 * Run: npx tsx src/scripts/fetch-recipes.ts
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

/* ========================================================================= */
/*  Types                                                                    */
/* ========================================================================= */

interface MealDBMeal {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  [key: string]: string | null;
}

interface MealDBResponse {
  meals: MealDBMeal[] | null;
}

interface SeedIngredient {
  name: string;
  amount: string;
}

interface SeedStep {
  order: number;
  title: string;
  instruction: string;
}

interface SeedNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface SeedRecipe {
  title: string;
  description: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  cookingTime: number;
  servings: number;
  ingredients: SeedIngredient[];
  steps: SeedStep[];
  nutrition: SeedNutrition;
  coverImage: string;
}

/* ========================================================================= */
/*  Constants — TheMealDB → zbite tag mapping                                */
/* ========================================================================= */

const API_BASE = 'https://www.themealdb.com/api/json/v1/1';
const MAX_INGREDIENT_SLOTS = 20;
const FETCH_DELAY_MS = 300;
const TARGET_RECIPE_COUNT = 500;

/** Maps TheMealDB `strArea` values to our cuisine tags. */
const AREA_TO_CUISINE: Record<string, string> = {
  American: 'American',
  Chinese: 'Chinese',
  Croatian: 'Mediterranean',
  Egyptian: 'Middle Eastern',
  Filipino: 'Asian',
  French: 'French',
  Greek: 'Greek',
  Indian: 'Indian',
  Italian: 'Italian',
  Jamaican: 'Caribbean',
  Japanese: 'Japanese',
  Korean: 'Korean',
  Malaysian: 'Asian',
  Mexican: 'Mexican',
  Moroccan: 'Middle Eastern',
  Portuguese: 'Mediterranean',
  Spanish: 'Mediterranean',
  Thai: 'Thai',
  Tunisian: 'Middle Eastern',
  Turkish: 'Middle Eastern',
  Vietnamese: 'Asian',
};

/** Maps TheMealDB `strCategory` values to our dish-type / dietary tags. */
const CATEGORY_TO_TAGS: Record<string, string[]> = {
  Beef: ['Beef'],
  Chicken: ['Chicken'],
  Dessert: ['Dessert', 'Baking'],
  Lamb: ['Lamb'],
  Pasta: ['Pasta'],
  Pork: ['Pork'],
  Seafood: ['Seafood'],
  Vegan: ['Vegan', 'Vegetarian', 'Healthy'],
  Vegetarian: ['Vegetarian'],
  Goat: ['Lamb'],
};

/** Cooking-time ranges (minutes) keyed by TheMealDB category. */
const COOKING_TIME_RANGE: Record<string, readonly [number, number]> = {
  Beef: [45, 90],
  Chicken: [30, 60],
  Dessert: [30, 75],
  Lamb: [50, 100],
  Pasta: [20, 40],
  Pork: [35, 70],
  Seafood: [15, 40],
  Side: [15, 30],
  Starter: [15, 30],
  Vegan: [20, 45],
  Vegetarian: [20, 45],
  Breakfast: [15, 30],
  Miscellaneous: [25, 50],
  Goat: [50, 90],
};

/** Base nutrition ranges keyed by TheMealDB category [min, max]. */
const NUTRITION_RANGES: Record<string, { calories: [number, number]; protein: [number, number]; carbs: [number, number]; fat: [number, number] }> = {
  Beef:          { calories: [450, 700], protein: [30, 50], carbs: [15, 45], fat: [18, 35] },
  Chicken:       { calories: [350, 550], protein: [28, 45], carbs: [20, 50], fat: [10, 25] },
  Dessert:       { calories: [300, 550], protein: [4, 12],  carbs: [40, 70], fat: [15, 30] },
  Lamb:          { calories: [450, 680], protein: [28, 45], carbs: [15, 40], fat: [20, 38] },
  Pasta:         { calories: [400, 620], protein: [14, 28], carbs: [50, 75], fat: [12, 25] },
  Pork:          { calories: [420, 650], protein: [26, 42], carbs: [18, 45], fat: [16, 32] },
  Seafood:       { calories: [250, 480], protein: [24, 40], carbs: [12, 35], fat: [8, 22]  },
  Side:          { calories: [150, 350], protein: [4, 14],  carbs: [20, 50], fat: [5, 18]  },
  Starter:       { calories: [200, 400], protein: [6, 18],  carbs: [18, 40], fat: [8, 20]  },
  Vegan:         { calories: [200, 420], protein: [8, 22],  carbs: [30, 60], fat: [5, 15]  },
  Vegetarian:    { calories: [250, 480], protein: [10, 24], carbs: [30, 60], fat: [8, 20]  },
  Breakfast:     { calories: [280, 500], protein: [12, 25], carbs: [25, 50], fat: [10, 25] },
  Miscellaneous: { calories: [300, 550], protein: [12, 28], carbs: [25, 55], fat: [10, 25] },
  Goat:          { calories: [400, 600], protein: [28, 42], carbs: [15, 40], fat: [16, 30] },
};

const DIFFICULTY_THRESHOLDS = { easy: 5, medium: 10 } as const;
const SERVINGS_OPTIONS = [2, 3, 4, 4, 4, 6] as const;

/* ========================================================================= */
/*  Deterministic pseudo-random (seeded by meal ID)                          */
/* ========================================================================= */

/** Simple hash to get a deterministic seed from a string. */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Returns a deterministic float [0, 1) for a given seed + offset. */
function seededFloat(seed: number, offset: number): number {
  const combined = ((seed + offset) * 2654435761) >>> 0;
  return (combined % 10000) / 10000;
}

/** Returns a deterministic integer in [min, max] inclusive. */
function seededInt(seed: number, offset: number, min: number, max: number): number {
  return min + Math.floor(seededFloat(seed, offset) * (max - min + 1));
}

/* ========================================================================= */
/*  API fetching                                                             */
/* ========================================================================= */

async function fetchMealsByLetter(letter: string): Promise<MealDBMeal[]> {
  const url = `${API_BASE}/search.php?f=${letter}`;
  const response = await fetch(url);
  const data = (await response.json()) as MealDBResponse;
  return data.meals ?? [];
}

async function fetchAllMeals(): Promise<MealDBMeal[]> {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const allMeals: MealDBMeal[] = [];

  for (const letter of letters) {
    const meals = await fetchMealsByLetter(letter);
    allMeals.push(...meals);
    process.stdout.write(`  [${letter.toUpperCase()}] ${meals.length} meals (total: ${allMeals.length})\n`);

    // Small delay to be polite to the free API
    await new Promise((resolve) => { setTimeout(resolve, FETCH_DELAY_MS); });
  }

  return allMeals;
}

/* ========================================================================= */
/*  Data transformation                                                      */
/* ========================================================================= */

/** Extract non-empty ingredient/measure pairs from a TheMealDB meal. */
function parseIngredients(meal: MealDBMeal): SeedIngredient[] {
  const ingredients: SeedIngredient[] = [];

  for (let i = 1; i <= MAX_INGREDIENT_SLOTS; i++) {
    const name = (meal[`strIngredient${i}`] ?? '').trim();
    const amount = (meal[`strMeasure${i}`] ?? '').trim();
    if (name) {
      ingredients.push({ name, amount: amount || '1' });
    }
  }

  return ingredients;
}

/** Split TheMealDB instructions into numbered steps. */
function parseSteps(instructions: string): SeedStep[] {
  const cleaned = instructions.replace(/\r\n/g, '\n').trim();
  if (!cleaned) return [{ order: 0, title: '', instruction: 'Prepare the dish.' }];

  // Try splitting by numbered patterns like "1.", "Step 1", "STEP 1"
  const numberedPattern = /(?:^|\n)\s*(?:step\s*)?\d+[.):\s]/i;
  const hasNumbering = numberedPattern.test(cleaned);

  let paragraphs: string[];

  if (hasNumbering) {
    paragraphs = cleaned
      .split(/\n\s*(?:step\s*)?\d+[.):\s]/i)
      .map((p) => p.trim())
      .filter(Boolean);
  } else {
    // Split by double newlines or single newlines that separate distinct paragraphs
    paragraphs = cleaned
      .split(/\n\n+/)
      .flatMap((block) => block.split(/\n/).filter((line) => line.trim().length > 10))
      .map((p) => p.trim())
      .filter(Boolean);
  }

  // Collapse into max 6 steps if too many, merge short paragraphs
  if (paragraphs.length === 0) {
    return [{ order: 0, title: '', instruction: cleaned }];
  }

  const MAX_STEPS = 6;
  if (paragraphs.length > MAX_STEPS) {
    const merged: string[] = [];
    const chunkSize = Math.ceil(paragraphs.length / MAX_STEPS);
    for (let i = 0; i < paragraphs.length; i += chunkSize) {
      merged.push(paragraphs.slice(i, i + chunkSize).join(' '));
    }
    paragraphs = merged;
  }

  return paragraphs.map((text, index) => ({
    order: index,
    title: '',
    instruction: text,
  }));
}

/** Derive zbite tags from TheMealDB area and category. */
function deriveTags(meal: MealDBMeal): string[] {
  const tags = new Set<string>();

  const cuisineTag = AREA_TO_CUISINE[meal.strArea];
  if (cuisineTag) tags.add(cuisineTag);

  const categoryTags = CATEGORY_TO_TAGS[meal.strCategory];
  if (categoryTags) {
    categoryTags.forEach((t) => tags.add(t));
  }

  return [...tags];
}

/** Estimate difficulty from ingredient count. */
function estimateDifficulty(ingredientCount: number): 'easy' | 'medium' | 'hard' {
  if (ingredientCount <= DIFFICULTY_THRESHOLDS.easy) return 'easy';
  if (ingredientCount <= DIFFICULTY_THRESHOLDS.medium) return 'medium';
  return 'hard';
}

/** Estimate cooking time from category with deterministic variation. */
function estimateCookingTime(category: string, seed: number): number {
  const range = COOKING_TIME_RANGE[category] ?? [25, 50];
  const raw = seededInt(seed, 1, range[0], range[1]);
  // Round to nearest 5 minutes for cleanliness
  const ROUNDING = 5;
  return Math.round(raw / ROUNDING) * ROUNDING;
}

/** Estimate nutrition from category with deterministic variation. */
function estimateNutrition(category: string, seed: number): SeedNutrition {
  const ranges = NUTRITION_RANGES[category] ?? NUTRITION_RANGES.Miscellaneous;
  return {
    calories: seededInt(seed, 2, ranges.calories[0], ranges.calories[1]),
    protein: seededInt(seed, 3, ranges.protein[0], ranges.protein[1]),
    carbs: seededInt(seed, 4, ranges.carbs[0], ranges.carbs[1]),
    fat: seededInt(seed, 5, ranges.fat[0], ranges.fat[1]),
  };
}

/** Estimate servings deterministically. */
function estimateServings(seed: number): number {
  const index = seed % SERVINGS_OPTIONS.length;
  return SERVINGS_OPTIONS[index];
}

/** Generate a short description from the meal name + category + area. */
function generateDescription(meal: MealDBMeal): string {
  const area = meal.strArea !== 'Unknown' ? `${meal.strArea} ` : '';
  const category = meal.strCategory.toLowerCase();
  return `A delicious ${area}${category} dish — ${meal.strMeal}. Perfect for a satisfying homemade meal.`;
}

/** Transform a single TheMealDB meal into our seed recipe format. */
function transformMeal(meal: MealDBMeal): SeedRecipe | null {
  const ingredients = parseIngredients(meal);
  if (ingredients.length === 0) return null;

  const tags = deriveTags(meal);
  if (tags.length === 0) return null;

  const seed = hashString(meal.idMeal);

  return {
    title: meal.strMeal.trim(),
    description: generateDescription(meal),
    tags,
    difficulty: estimateDifficulty(ingredients.length),
    cookingTime: estimateCookingTime(meal.strCategory, seed),
    servings: estimateServings(seed),
    ingredients,
    steps: parseSteps(meal.strInstructions),
    nutrition: estimateNutrition(meal.strCategory, seed),
    coverImage: meal.strMealThumb,
  };
}

/* ========================================================================= */
/*  Main                                                                     */
/* ========================================================================= */

async function main(): Promise<void> {
  process.stdout.write('Fetching meals from TheMealDB...\n');
  const rawMeals = await fetchAllMeals();
  process.stdout.write(`\nFetched ${rawMeals.length} raw meals.\n`);

  // Deduplicate by meal ID
  const uniqueMeals = [...new Map(rawMeals.map((m) => [m.idMeal, m])).values()];
  process.stdout.write(`Unique meals: ${uniqueMeals.length}\n`);

  // Transform and filter out failures
  const recipes = uniqueMeals
    .map(transformMeal)
    .filter((r): r is SeedRecipe => r !== null);
  process.stdout.write(`Successfully transformed: ${recipes.length}\n`);

  // Select up to TARGET_RECIPE_COUNT, preferring recipes with more tags
  const sorted = [...recipes].sort((a, b) => b.tags.length - a.tags.length);
  const selected = sorted.slice(0, TARGET_RECIPE_COUNT);

  const outputPath = join(__dirname, 'data', 'recipes.json');
  writeFileSync(outputPath, JSON.stringify(selected, null, 2), 'utf-8');
  process.stdout.write(`\nWrote ${selected.length} recipes to ${outputPath}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`Fatal error: ${error}\n`);
  process.exit(1);
});
