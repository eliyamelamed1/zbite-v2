/**
 * Direct HTTP client for e2e test setup.
 * Bypasses the UI to create users, recipes, follows, etc. via API calls.
 * This is the key speed optimisation — API setup is ~10ms vs ~10s through the UI.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const API_BASE_URL = 'http://localhost:5000/api';
const MAX_RETRIES = 5;
const RETRY_BASE_DELAY_MS = 2_000;

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const FALLBACK_IMAGE_PATH = path.join(currentDir, '..', 'fixtures', 'test-image.png');

interface AuthResponse {
  token: string;
  user: {
    _id: string;
    username: string;
    email: string;
  };
}

interface TestUserCredentials {
  username: string;
  email: string;
  password: string;
}

interface TestUserWithToken extends TestUserCredentials {
  id: string;
  token: string;
}

interface CreateRecipeOptions {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  cookingTime: number;
  servings: number;
  ingredients: ReadonlyArray<{ name: string; amount: string }>;
  steps: ReadonlyArray<{ order: number; title: string; instruction: string }>;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface CreatedRecipe {
  id: string;
  title: string;
}

/** Retry-aware fetch wrapper that handles 429 rate limits. */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
): Promise<Response> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const response = await fetch(url, options);

    if (response.status !== 429) {
      return response;
    }

    // Rate limited — wait and retry with exponential backoff
    const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // Final attempt without retry
  return fetch(url, options);
}

/** Register a new user via the API and return credentials + token. */
export async function registerUserViaApi(
  credentials: TestUserCredentials,
): Promise<TestUserWithToken> {
  const response = await fetchWithRetry(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to register user ${credentials.username}: ${error}`);
  }

  const data = (await response.json()) as AuthResponse;

  return {
    ...credentials,
    id: data.user._id,
    token: data.token,
  };
}

/** Login an existing user via the API and return the JWT token. */
export async function loginViaApi(email: string, password: string): Promise<string> {
  const response = await fetchWithRetry(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to login ${email}: ${error}`);
  }

  const data = (await response.json()) as AuthResponse;
  return data.token;
}

/** Create a recipe via the API using multipart form data (required by server). */
export async function createRecipeViaApi(
  token: string,
  options: CreateRecipeOptions,
): Promise<CreatedRecipe> {
  const formData = new FormData();

  // Server expects recipe data as a JSON string in a "data" field
  formData.append('data', JSON.stringify(options));
  formData.append('stepImageMap', '{}');

  // Attach a cover image (required by the server)
  const imageBuffer = fs.readFileSync(FALLBACK_IMAGE_PATH);
  const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
  formData.append('coverImage', imageBlob, 'test-cover.png');

  const response = await fetchWithRetry(`${API_BASE_URL}/recipes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create recipe "${options.title}": ${error}`);
  }

  const data = (await response.json()) as { recipe: { _id: string; title: string } };
  return { id: data.recipe._id, title: data.recipe.title };
}

/** Follow a user via the API. */
export async function followUserViaApi(token: string, targetUserId: string): Promise<void> {
  const response = await fetchWithRetry(`${API_BASE_URL}/follows/${targetUserId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to follow user ${targetUserId}: ${error}`);
  }
}

/** Like a recipe via the API. */
export async function likeRecipeViaApi(token: string, recipeId: string): Promise<void> {
  const response = await fetchWithRetry(`${API_BASE_URL}/likes/${recipeId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to like recipe ${recipeId}: ${error}`);
  }
}

/** Comment on a recipe via the API. */
export async function commentOnRecipeViaApi(
  token: string,
  recipeId: string,
  text: string,
): Promise<void> {
  const response = await fetchWithRetry(`${API_BASE_URL}/comments/${recipeId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to comment on recipe ${recipeId}: ${error}`);
  }
}

/** Rate a recipe via the API. */
export async function rateRecipeViaApi(
  token: string,
  recipeId: string,
  stars: number,
): Promise<void> {
  const response = await fetchWithRetry(`${API_BASE_URL}/ratings/${recipeId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ stars }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to rate recipe ${recipeId}: ${error}`);
  }
}

/** Save a recipe via the API. */
export async function saveRecipeViaApi(token: string, recipeId: string): Promise<void> {
  const response = await fetchWithRetry(`${API_BASE_URL}/saved/${recipeId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to save recipe ${recipeId}: ${error}`);
  }
}

/** Add a recipe's ingredients to the shopping list via the API. */
export async function addRecipeToShoppingListViaApi(token: string, recipeId: string): Promise<void> {
  const response = await fetchWithRetry(`${API_BASE_URL}/shopping-list/add-recipe/${recipeId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add recipe to shopping list: ${error}`);
  }
}

/** Create a collection via the API. */
export async function createCollectionViaApi(
  token: string,
  name: string,
): Promise<{ id: string; name: string }> {
  const response = await fetchWithRetry(`${API_BASE_URL}/collections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create collection "${name}": ${error}`);
  }

  const data = (await response.json()) as { _id: string; name: string };
  return { id: data._id, name: data.name };
}

/** Record a cook via the gamification API. */
export async function recordCookViaApi(token: string): Promise<void> {
  const response = await fetchWithRetry(`${API_BASE_URL}/gamification/cook`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to record cook: ${error}`);
  }
}
