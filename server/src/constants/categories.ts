export const CATEGORIES = [
  'Italian',
  'Asian',
  'Vegan',
  'Quick Meals',
  'Seafood',
  'Greek',
  'Baking',
  'Desserts',
  'Healthy',
] as const;

export type Category = (typeof CATEGORIES)[number];
