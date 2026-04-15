/** Default debounce delay for search inputs. */
export const DEBOUNCE_MS = 300;

/** Minimum characters before triggering a user search. */
export const MIN_SEARCH_LENGTH = 2;

/** Maximum search results shown in the dropdown. */
export const SEARCH_RESULTS_LIMIT = 5;

/** Default page size for recipe feeds. */
export const DEFAULT_PAGE_SIZE = 12;

/** Max cooking time (minutes) for "Quick" recipe filter. */
export const QUICK_RECIPE_MAX_MINUTES = 30;

/** Minimum password length for registration. */
export const MIN_PASSWORD_LENGTH = 6;

/** Minimum username length for registration. */
export const MIN_USERNAME_LENGTH = 3;

/** Minimum number of interests required during onboarding. */
export const MIN_INTERESTS = 3;

/** Number of milliseconds in one hour. */
export const ONE_HOUR_MS = 3_600_000;

/** Number of hours in one day. */
export const ONE_DAY_HOURS = 24;

/** Number of hours in one week. */
export const ONE_WEEK_HOURS = 168;

/** Confetti configuration for recipe publish celebration. */
export const CONFETTI_CONFIG = { particleCount: 150, spread: 80, origin: { y: 0.6 } };

/** Default number of recipes per page in recommendation results. */
export const RECOMMEND_PAGE_SIZE = 4;

/** Number of recipe cards shown per row on the Home page. */
export const HOME_PREVIEW_LIMIT = 4;

/** Time constraint options for the Choose flow. */
export const TIME_OPTIONS = [
  { label: 'Under 15 min', value: '0-15' },
  { label: '15-30 min', value: '15-30' },
  { label: '30-60 min', value: '30-60' },
  { label: '60+ min', value: '60-max' },
] as const;

/** Category options for "Help Me Decide" path. */
export const CATEGORY_OPTIONS = [
  { label: 'Pasta', value: 'pasta' },
  { label: 'Chicken', value: 'chicken' },
  { label: 'Beef', value: 'beef' },
  { label: 'Seafood', value: 'seafood' },
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Rice & Noodles', value: 'rice-noodles' },
  { label: 'Soup & Stew', value: 'soup-stew' },
  { label: 'Salad & Bowl', value: 'salad-bowl' },
  { label: 'Sandwich & Wrap', value: 'sandwich-wrap' },
] as const;

/** Preference options for "Help Me Decide" step 3. */
export const PREFERENCE_OPTIONS = [
  { label: 'Healthy', value: 'healthy' },
  { label: 'High Protein', value: 'high-protein' },
  { label: 'Budget Friendly', value: 'budget' },
  { label: 'Family Friendly', value: 'family-friendly' },
  { label: 'One Pan', value: 'one-pan' },
  { label: 'Meal Prep', value: 'meal-prep' },
] as const;
