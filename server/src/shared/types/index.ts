import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  avatar: string;
  bio: string;
  interests: string[];
  recipesCount: number;
  followersCount: number;
  followingCount: number;
  chefScore: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

export interface IRecipe extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  author: Types.ObjectId | IUser;
  tags: string[];
  systemTags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  cookingTime: number;
  servings: number;
  ingredients: { name: string; amount: string }[];
  steps: { order: number; title: string; instruction: string; image: string }[];
  nutrition: { calories: number; protein: number; carbs: number; fat: number };
  coverImage: string;
  status: 'draft' | 'published';
  viewsCount: number;
  commentsCount: number;
  savesCount: number;
  reportsCount: number;
  recipeScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISavedRecipe extends Document {
  user: Types.ObjectId;
  recipe: Types.ObjectId;
  savedAt: Date;
}

export interface IFollow extends Document {
  follower: Types.ObjectId;
  following: Types.ObjectId;
  createdAt: Date;
}

export interface IComment extends Document {
  user: Types.ObjectId | IUser;
  recipe: Types.ObjectId;
  text: string;
  parentComment?: Types.ObjectId;
  repliesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification extends Document {
  recipient: Types.ObjectId;
  sender: Types.ObjectId | IUser;
  type: 'follow' | 'save' | 'comment' | 'mention' | 'cooking_report';
  recipe?: Types.ObjectId | IRecipe;
  read: boolean;
  createdAt: Date;
}

/** Decoded JWT payload attached to authenticated requests. */
export interface AuthUser {
  id: string;
  username: string;
}

/** Standard paginated response shape. */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
