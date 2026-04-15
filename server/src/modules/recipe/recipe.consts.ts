/** Valid food categories for the recipe decider "Help Me Decide" path. */
export const VALID_CATEGORIES = [
  'pasta', 'chicken', 'beef', 'seafood', 'vegetarian',
  'rice-noodles', 'soup-stew', 'salad-bowl', 'sandwich-wrap',
] as const;
export type RecipeCategory = (typeof VALID_CATEGORIES)[number];

/** Valid preference filters (optional step in the decider). */
export const VALID_PREFERENCES = [
  'healthy', 'high-protein', 'budget', 'family-friendly', 'one-pan', 'meal-prep',
] as const;
export type Preference = (typeof VALID_PREFERENCES)[number];

/**
 * Maps each food category to ingredient keywords used for auto-tagging.
 * When a recipe is saved, its ingredient names are scanned against these keywords.
 * Matches produce `cat:<category>` system tags (e.g. `cat:pasta`, `cat:chicken`).
 */
export const CATEGORY_INGREDIENT_MAP: Record<RecipeCategory, readonly string[]> = {
  pasta: [
    'spaghetti', 'penne', 'fettuccine', 'linguine', 'rigatoni', 'macaroni',
    'fusilli', 'lasagna', 'orzo', 'farfalle', 'tagliatelle', 'tortellini',
    'ravioli', 'gnocchi', 'noodle', 'pasta',
  ],
  chicken: [
    'chicken', 'chicken breast', 'chicken thigh', 'chicken wing',
    'chicken drumstick', 'chicken tender', 'poultry', 'turkey',
  ],
  beef: [
    'beef', 'steak', 'ground beef', 'sirloin', 'ribeye', 'brisket',
    'chuck', 'tenderloin', 'flank', 'mince', 'veal',
  ],
  seafood: [
    'salmon', 'shrimp', 'tuna', 'cod', 'tilapia', 'prawns', 'crab',
    'lobster', 'scallop', 'mussel', 'clam', 'squid', 'fish',
    'anchovy', 'sardine', 'halibut', 'swordfish', 'bass',
  ],
  vegetarian: [
    'tofu', 'tempeh', 'paneer', 'chickpea', 'lentil', 'black bean',
    'kidney bean', 'edamame', 'seitan', 'mushroom', 'eggplant',
    'zucchini', 'cauliflower', 'broccoli', 'spinach', 'kale',
  ],
  'rice-noodles': [
    'rice', 'basmati', 'jasmine rice', 'brown rice', 'arborio',
    'sushi rice', 'rice noodle', 'udon', 'soba', 'ramen',
    'vermicelli', 'glass noodle', 'lo mein', 'egg noodle',
  ],
  'soup-stew': [
    'broth', 'stock', 'bouillon', 'consomme', 'stew meat', 'soup base', 'dashi',
  ],
  'salad-bowl': [
    'lettuce', 'arugula', 'romaine', 'mixed greens', 'spring mix',
    'quinoa', 'couscous', 'bulgur', 'farro',
  ],
  'sandwich-wrap': [
    'bread', 'tortilla', 'pita', 'bun', 'ciabatta', 'baguette',
    'wrap', 'flatbread', 'naan', 'focaccia', 'roll', 'bagel',
  ],
};

/** Maps preference values to the system tags they filter by. */
export const PREFERENCE_SYSTEM_TAGS: Partial<Record<Preference, readonly string[]>> = {
  healthy: ['low-calorie', 'low-fat'],
  'high-protein': ['high-protein'],
  budget: ['few-ingredients'],
  'one-pan': ['one-pot'],
};

/** Minimum servings to qualify as "family friendly". */
export const FAMILY_FRIENDLY_MIN_SERVINGS = 4;

/** Minimum servings to qualify as "meal prep". */
export const MEAL_PREP_MIN_SERVINGS = 6;

/** Default number of recipes per page in recommendation results. */
export const RECOMMEND_PAGE_SIZE = 4;

/** Maximum "Your Go-To" recipes to return in decider results. */
export const USUALS_LIMIT = 3;
