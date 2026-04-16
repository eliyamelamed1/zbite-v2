/** Cuisine-based tags — where the recipe comes from. */
export const CUISINE_TAGS = [
  'Italian', 'Asian', 'Chinese', 'Japanese', 'Thai', 'Indian', 'Mexican',
  'Greek', 'French', 'Middle Eastern', 'Korean', 'American', 'Mediterranean', 'Caribbean',
] as const;

/** Dish-type tags — what the recipe is. */
export const DISH_TYPE_TAGS = [
  'Beef', 'Chicken', 'Seafood', 'Pork', 'Lamb', 'Pasta',
  'Soup', 'Salad', 'Baking', 'Dessert', 'Vegetarian',
] as const;

/** Dietary / lifestyle tags — who the recipe is for. */
export const DIETARY_TAGS = [
  'Vegan', 'Healthy', 'Quick Meals', 'Gluten-Free',
  'Low-Carb', 'High-Protein', 'Budget-Friendly', 'Meal Prep',
] as const;

/** Meal-type tags — when you'd eat it. Optional, 0-2 per recipe. */
export const MEAL_TYPE_TAGS = ['Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Snack'] as const;

/** All predefined user tags combined. */
export const ALL_TAGS = [...CUISINE_TAGS, ...DISH_TYPE_TAGS, ...DIETARY_TAGS, ...MEAL_TYPE_TAGS] as const;

export type Tag = (typeof ALL_TAGS)[number];

/**
 * @deprecated Use ALL_TAGS instead. Kept temporarily for migration.
 */
export const CATEGORIES = ALL_TAGS;
export type Category = Tag;
