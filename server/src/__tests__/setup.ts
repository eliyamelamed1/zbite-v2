import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app';
import Recipe from '../models/Recipe';

let mongoServer: MongoMemoryServer;
let app: FastifyInstance;

process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests';

export async function setupTestEnvironment(): Promise<FastifyInstance> {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  app = await buildApp();
  await app.ready();
  return app;
}

export async function teardownTestEnvironment(): Promise<void> {
  await app?.close();
  await mongoose.disconnect();
  await mongoServer?.stop();
}

export async function cleanDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

// Helpers

let userCounter = 0;

export async function registerAndLogin(
  app: FastifyInstance,
  overrides?: { username?: string; email?: string; password?: string }
) {
  userCounter++;
  const username = overrides?.username || `testuser${userCounter}`;
  const email = overrides?.email || `test${userCounter}@example.com`;
  const password = overrides?.password || 'password123';

  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { username, email, password },
  });

  const body = JSON.parse(res.body);
  return { token: body.token as string, user: body.user, response: res };
}

export function authHeader(token: string) {
  return { authorization: `Bearer ${token}` };
}

/**
 * Creates a test recipe by inserting directly into MongoDB.
 * We bypass multipart upload because @fastify/multipart's request.parts()
 * async iterator doesn't work reliably with Fastify's .inject().
 */
export async function createTestRecipe(
  app: FastifyInstance,
  token: string,
  overrides?: Partial<{
    title: string;
    description: string;
    tags: string[];
    difficulty: string;
    cookingTime: number;
    servings: number;
  }>
) {
  // Get user ID from token
  const meRes = await app.inject({ method: 'GET', url: '/api/auth/me', headers: authHeader(token) });
  const userId = JSON.parse(meRes.body).user._id;

  const recipe = await Recipe.create({
    title: overrides?.title || 'Test Recipe',
    description: overrides?.description || 'A delicious test recipe',
    tags: overrides?.tags || ['Italian'],
    difficulty: overrides?.difficulty || 'medium',
    cookingTime: overrides?.cookingTime || 30,
    servings: overrides?.servings || 4,
    ingredients: [
      { amount: '200g', name: 'Test Ingredient' },
      { amount: '1 cup', name: 'Another Ingredient' },
    ],
    steps: [
      { order: 1, title: 'Step One', instruction: 'Do the first thing', image: '' },
      { order: 2, title: 'Step Two', instruction: 'Do the second thing', image: '' },
    ],
    nutrition: { calories: 350, protein: 20, carbs: 40, fat: 15 },
    coverImage: '/uploads/recipes/test-cover.png',
    author: userId,
  });

  // Increment user recipesCount (like the route would)
  const User = mongoose.model('User');
  await User.findByIdAndUpdate(userId, { $inc: { recipesCount: 1 } });

  await recipe.populate('author', 'username avatar');

  return { recipe: recipe.toJSON(), response: { statusCode: 201 } };
}
