export interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  interests: string[];
  recipesCount: number;
  followersCount: number;
  followingCount: number;
  chefScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Recipe {
  _id: string;
  title: string;
  description: string;
  author: User;
  tags: string[];
  systemTags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  cookingTime: number;
  servings: number;
  ingredients: { name: string; amount: string }[];
  steps: { order: number; title: string; instruction: string; image: string }[];
  nutrition: { calories: number; protein: number; carbs: number; fat: number };
  coverImage: string;
  commentsCount: number;
  savesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  user: User;
  recipe: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender: User;
  type: 'follow' | 'save' | 'comment' | 'mention' | 'cooking_report';
  recipe?: Recipe;
  read: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  score: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface CookingStreak {
  currentStreak: number;
  longestStreak: number;
  lastCookDate: string;
  totalCooked: number;
}

export interface Achievement {
  _id: string;
  type: string;
  unlockedAt: string;
}

/** @deprecated Use ALL_TAGS, CUISINE_TAGS, DISH_TYPE_TAGS, or DIETARY_TAGS instead. */
export const CATEGORIES = [
  'Italian', 'Asian', 'Vegan', 'Quick Meals', 'Seafood', 'Greek', 'Baking', 'Desserts', 'Healthy',
] as const;

export const CUISINE_TAGS = [
  'Italian', 'Asian', 'Chinese', 'Japanese', 'Thai', 'Indian', 'Mexican',
  'Greek', 'French', 'Middle Eastern', 'Korean', 'American', 'Mediterranean', 'Caribbean',
] as const;

export const DISH_TYPE_TAGS = [
  'Beef', 'Chicken', 'Seafood', 'Pork', 'Lamb', 'Pasta',
  'Soup', 'Salad', 'Baking', 'Dessert', 'Vegetarian',
] as const;

export const DIETARY_TAGS = [
  'Vegan', 'Healthy', 'Quick Meals', 'Gluten-Free',
  'Low-Carb', 'High-Protein', 'Budget-Friendly', 'Meal Prep',
] as const;

export const ALL_TAGS = [...CUISINE_TAGS, ...DISH_TYPE_TAGS, ...DIETARY_TAGS] as const;

export type Tag = (typeof ALL_TAGS)[number];
