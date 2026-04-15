import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import Recipe from '../models/Recipe';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, createTestRecipe, authHeader } from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('Recipe Drafts', () => {
  it('creates a recipe as draft', async () => {
    const { token } = await registerAndLogin(app);
    const meRes = await app.inject({ method: 'GET', url: '/api/auth/me', headers: authHeader(token) });
    const userId = JSON.parse(meRes.body).user._id;
    const draft = await Recipe.create({
      title: 'Draft Recipe',
      description: 'Work in progress',
      tags: ['Italian'],
      difficulty: 'easy',
      cookingTime: 20,
      servings: 2,
      ingredients: [{ amount: '100g', name: 'Pasta' }],
      steps: [{ order: 1, title: 'Step 1', instruction: 'Do something', image: '' }],
      nutrition: { calories: 200, protein: 10, carbs: 30, fat: 5 },
      coverImage: '/test.png',
      author: userId,
      status: 'draft',
    });
    expect(draft.status).toBe('draft');
  });

  it('draft does not appear in explore feed', async () => {
    const { token } = await registerAndLogin(app);
    const meRes = await app.inject({ method: 'GET', url: '/api/auth/me', headers: authHeader(token) });
    const userId = JSON.parse(meRes.body).user._id;
    await Recipe.create({
      title: 'Hidden Draft',
      description: 'Should not appear',
      tags: ['Italian'],
      difficulty: 'easy',
      cookingTime: 20,
      servings: 2,
      ingredients: [{ amount: '100g', name: 'Pasta' }],
      steps: [{ order: 1, title: 'Step 1', instruction: 'Do something', image: '' }],
      nutrition: { calories: 200, protein: 10, carbs: 30, fat: 5 },
      coverImage: '/test.png',
      author: userId,
      status: 'draft',
    });
    const res = await app.inject({ method: 'GET', url: '/api/recipes/explore' });
    const data = JSON.parse(res.body).data;
    const titles = data.map((r: { title: string }) => r.title);
    expect(titles).not.toContain('Hidden Draft');
  });

  it('draft does not appear in following feed', async () => {
    const author = await registerAndLogin(app);
    const follower = await registerAndLogin(app);
    const meRes = await app.inject({ method: 'GET', url: '/api/auth/me', headers: authHeader(author.token) });
    const authorId = JSON.parse(meRes.body).user._id;
    await Recipe.create({
      title: 'Author Draft',
      description: 'Should not show in following',
      tags: ['Italian'],
      difficulty: 'easy',
      cookingTime: 20,
      servings: 2,
      ingredients: [{ amount: '100g', name: 'Pasta' }],
      steps: [{ order: 1, title: 'Step 1', instruction: 'Do something', image: '' }],
      nutrition: { calories: 200, protein: 10, carbs: 30, fat: 5 },
      coverImage: '/test.png',
      author: authorId,
      status: 'draft',
    });
    await app.inject({ method: 'POST', url: `/api/follows/${author.user._id}`, headers: authHeader(follower.token) });
    const res = await app.inject({ method: 'GET', url: '/api/recipes/following', headers: authHeader(follower.token) });
    const data = JSON.parse(res.body).data;
    expect(data).toHaveLength(0);
  });

  it('draft appears in users drafts list', async () => {
    const { token } = await registerAndLogin(app);
    const meRes = await app.inject({ method: 'GET', url: '/api/auth/me', headers: authHeader(token) });
    const userId = JSON.parse(meRes.body).user._id;
    await Recipe.create({
      title: 'My Draft',
      description: 'Visible in drafts',
      tags: ['Italian'],
      difficulty: 'easy',
      cookingTime: 20,
      servings: 2,
      ingredients: [{ amount: '100g', name: 'Pasta' }],
      steps: [{ order: 1, title: 'Step 1', instruction: 'Do something', image: '' }],
      nutrition: { calories: 200, protein: 10, carbs: 30, fat: 5 },
      coverImage: '/test.png',
      author: userId,
      status: 'draft',
    });
    const res = await app.inject({ method: 'GET', url: '/api/recipes/drafts', headers: authHeader(token) });
    const data = JSON.parse(res.body).data;
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe('My Draft');
  });

  it('publishing changes status', async () => {
    const { token } = await registerAndLogin(app);
    const meRes = await app.inject({ method: 'GET', url: '/api/auth/me', headers: authHeader(token) });
    const userId = JSON.parse(meRes.body).user._id;
    const draft = await Recipe.create({
      title: 'Soon Published',
      description: 'Will be published',
      tags: ['Italian'],
      difficulty: 'easy',
      cookingTime: 20,
      servings: 2,
      ingredients: [{ amount: '100g', name: 'Pasta' }],
      steps: [{ order: 1, title: 'Step 1', instruction: 'Do something', image: '' }],
      nutrition: { calories: 200, protein: 10, carbs: 30, fat: 5 },
      coverImage: '/test.png',
      author: userId,
      status: 'draft',
    });
    await Recipe.findByIdAndUpdate(draft._id, { status: 'published' });
    const res = await app.inject({ method: 'GET', url: '/api/recipes/explore' });
    const data = JSON.parse(res.body).data;
    const titles = data.map((r: { title: string }) => r.title);
    expect(titles).toContain('Soon Published');
  });

  it('draft does not increment recipesCount', async () => {
    const { token } = await registerAndLogin(app);
    const meRes = await app.inject({ method: 'GET', url: '/api/auth/me', headers: authHeader(token) });
    const userId = JSON.parse(meRes.body).user._id;
    await Recipe.create({
      title: 'Draft No Count',
      description: 'Should not count',
      tags: ['Italian'],
      difficulty: 'easy',
      cookingTime: 20,
      servings: 2,
      ingredients: [{ amount: '100g', name: 'Pasta' }],
      steps: [{ order: 1, title: 'Step 1', instruction: 'Do something', image: '' }],
      nutrition: { calories: 200, protein: 10, carbs: 30, fat: 5 },
      coverImage: '/test.png',
      author: userId,
      status: 'draft',
    });
    const userRes = await app.inject({ method: 'GET', url: '/api/auth/me', headers: authHeader(token) });
    expect(JSON.parse(userRes.body).user.recipesCount).toBe(0);
  });

  it('published recipe increments recipesCount', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token);
    const userRes = await app.inject({ method: 'GET', url: '/api/auth/me', headers: authHeader(token) });
    expect(JSON.parse(userRes.body).user.recipesCount).toBe(1);
  });

  it('drafts endpoint requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/recipes/drafts' });
    expect(res.statusCode).toBe(401);
  });
});
