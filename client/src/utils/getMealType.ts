/** Time boundaries for meal type windows. */
const BREAKFAST_START = 5;
const BREAKFAST_END = 10;
const LUNCH_START = 11;
const LUNCH_END = 14;
const DINNER_START = 17;
const DINNER_END = 21;

type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

/** Map the current hour to a meal type. */
export function getMealType(hour?: number): MealType {
  const currentHour = hour ?? new Date().getHours();

  if (currentHour >= BREAKFAST_START && currentHour < BREAKFAST_END) return 'Breakfast';
  if (currentHour >= LUNCH_START && currentHour <= LUNCH_END) return 'Lunch';
  if (currentHour >= DINNER_START && currentHour <= DINNER_END) return 'Dinner';
  return 'Snack';
}

/** Friendly titles for each meal type on the Home page. */
export const MEAL_TITLE_MAP: Record<MealType, string> = {
  Breakfast: 'Good Morning',
  Lunch: 'Lunch Break',
  Dinner: "Tonight's Dinner",
  Snack: 'Snack Time',
};
