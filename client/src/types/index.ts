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
  createdAt: string;
  updatedAt: string;
}

export interface Recipe {
  _id: string;
  title: string;
  description: string;
  author: User;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cookingTime: number;
  servings: number;
  ingredients: { name: string; amount: string }[];
  steps: { order: number; title: string; instruction: string; image: string }[];
  nutrition: { calories: number; protein: number; carbs: number; fat: number };
  coverImage: string;
  averageRating: number;
  ratingsCount: number;
  likesCount: number;
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
  type: 'like' | 'follow' | 'save' | 'rate' | 'comment' | 'mention';
  recipe?: Recipe;
  read: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
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

export const CATEGORIES = [
  'Italian', 'Asian', 'Vegan', 'Quick Meals', 'Seafood', 'Greek', 'Baking', 'Desserts', 'Healthy',
] as const;
