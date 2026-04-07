/** Millisecond threshold to detect a double-tap gesture. */
export const DOUBLE_TAP_THRESHOLD_MS = 400;

/** Duration of the heart burst animation on double-tap like. */
export const HEART_ANIMATION_MS = 800;

/** Duration of the like button scale bounce animation. */
export const LIKE_ANIMATION_MS = 350;

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
