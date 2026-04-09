/**
 * Concurrency-safe test data factories.
 * Each call produces unique data so parallel tests never collide.
 */
import path from 'path';
import { fileURLToPath } from 'url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const TEST_IMAGE_PATH = path.join(currentDir, 'test-image.png');

const DEFAULT_PASSWORD = 'testpass123';

/** Unique prefix combining timestamp + random suffix to avoid collisions in parallel runs. */
function createUniquePrefix(): string {
  return `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}

export interface TestUserData {
  username: string;
  email: string;
  password: string;
}

/** Create unique user credentials. `role` is a human-readable prefix (e.g. 'chef', 'viewer'). */
export function createUserData(role: string): TestUserData {
  const prefix = createUniquePrefix();
  return {
    username: `${role}${prefix}`,
    email: `${role}${prefix}@test.com`,
    password: DEFAULT_PASSWORD,
  };
}

export interface TestRecipeData {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  cookingTime: number;
  servings: number;
  ingredients: ReadonlyArray<{ name: string; amount: string }>;
  steps: ReadonlyArray<{ order: number; title: string; instruction: string }>;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

/** Create unique recipe data. */
export function createRecipeData(titlePrefix = 'Recipe'): TestRecipeData {
  const prefix = createUniquePrefix();
  return {
    title: `${titlePrefix} ${prefix}`,
    description: 'A delicious test recipe created by e2e tests.',
    category: 'Italian',
    difficulty: 'medium',
    cookingTime: 30,
    servings: 4,
    ingredients: [
      { amount: '400g', name: 'Spaghetti' },
      { amount: '200g', name: 'Guanciale' },
    ],
    steps: [
      { order: 0, title: 'Boil pasta', instruction: 'Boil water and cook pasta until al dente.' },
    ],
    nutrition: { calories: 450, protein: 25, carbs: 50, fat: 18 },
  };
}

/** Default interests for signup flows. */
export const DEFAULT_INTERESTS = ['Italian', 'Asian', 'Baking'] as const;
export const ALTERNATE_INTERESTS = ['Vegan', 'Seafood', 'Desserts'] as const;
