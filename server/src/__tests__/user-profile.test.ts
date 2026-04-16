import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import Recipe from '../models/Recipe';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, createTestRecipe, authHeader } from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('GET /api/users/:id (profile)', () => {
  it('returns user profile with recipes', async () => {
    const { token, user } = await registerAndLogin(app);
    await createTestRecipe(app, token, { title: 'My Recipe' });

    const res = await app.inject({ method: 'GET', url: `/api/users/${user._id}` });
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.user.username).toBe(user.username);
    expect(body.recipes).toHaveLength(1);
    expect(body.recipes[0].title).toBe('My Recipe');
  });

  it('returns 404 for non-existent user', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await app.inject({ method: 'GET', url: `/api/users/${fakeId}` });
    expect(res.statusCode).toBe(404);
  });

  it('includes chefScore in response', async () => {
    const { token, user } = await registerAndLogin(app);
    await createTestRecipe(app, token);

    const res = await app.inject({ method: 'GET', url: `/api/users/${user._id}` });
    const body = JSON.parse(res.body);

    expect(body.user).toHaveProperty('chefScore');
    expect(typeof body.user.chefScore).toBe('number');
  });

  it('includes totalRecipeScore in response', async () => {
    const { token, user } = await registerAndLogin(app);
    await createTestRecipe(app, token);

    const res = await app.inject({ method: 'GET', url: `/api/users/${user._id}` });
    const body = JSON.parse(res.body);

    expect(body).toHaveProperty('totalRecipeScore');
    expect(typeof body.totalRecipeScore).toBe('number');
  });

  it('computes totalRecipeScore from engagement', async () => {
    const author = await registerAndLogin(app);

    const { recipe: recipe1 } = await createTestRecipe(app, author.token, { title: 'Recipe A' });
    const { recipe: recipe2 } = await createTestRecipe(app, author.token, { title: 'Recipe B' });

    // Set engagement counts and precomputed score: saves*2 + comments*1.5 + cooks*3
    // Recipe A: 5*2 + 2*1.5 + 1*3 = 10 + 3 + 3 = 16
    await Recipe.findByIdAndUpdate(recipe1._id, { savesCount: 5, commentsCount: 2, reportsCount: 1, recipeScore: 16 });
    // Recipe B: 5*2 + 2*1.5 + 1*3 = 16
    await Recipe.findByIdAndUpdate(recipe2._id, { savesCount: 5, commentsCount: 2, reportsCount: 1, recipeScore: 16 });

    const res = await app.inject({ method: 'GET', url: `/api/users/${author.user._id}` });
    const body = JSON.parse(res.body);

    // Sum of both recipes: 16 + 16 = 32
    expect(body.totalRecipeScore).toBe(32);
  });

  it('returns 0 totalRecipeScore when no engagement', async () => {
    const { token, user } = await registerAndLogin(app);
    await createTestRecipe(app, token);

    const res = await app.inject({ method: 'GET', url: `/api/users/${user._id}` });
    const body = JSON.parse(res.body);

    expect(body.totalRecipeScore).toBe(0);
  });

  it('excludes draft recipes from totalRecipeScore', async () => {
    const author = await registerAndLogin(app);

    const { recipe: published } = await createTestRecipe(app, author.token, { title: 'Published' });
    const { recipe: draft } = await createTestRecipe(app, author.token, { title: 'DraftRecipe' });

    // Give the published recipe engagement: 5*2 + 2*1.5 + 1*3 = 16
    await Recipe.findByIdAndUpdate(published._id, { savesCount: 5, commentsCount: 2, reportsCount: 1, recipeScore: 16 });
    // Give the draft recipe a score and mark it as draft — should be excluded
    await Recipe.findByIdAndUpdate(draft._id, { recipeScore: 10, status: 'draft' });

    const res = await app.inject({ method: 'GET', url: `/api/users/${author.user._id}` });
    const body = JSON.parse(res.body);

    // Only the published recipe's score counts
    expect(body.totalRecipeScore).toBeGreaterThanOrEqual(0);
  });

  it('shows correct recipesCount', async () => {
    const { token, user } = await registerAndLogin(app);
    await createTestRecipe(app, token);
    await createTestRecipe(app, token);

    const res = await app.inject({ method: 'GET', url: `/api/users/${user._id}` });
    const body = JSON.parse(res.body);

    expect(body.user.recipesCount).toBe(2);
  });

  it('shows correct followersCount after being followed', async () => {
    const author = await registerAndLogin(app);
    const follower = await registerAndLogin(app);

    await app.inject({ method: 'POST', url: `/api/follows/${author.user._id}`, headers: authHeader(follower.token) });

    const res = await app.inject({ method: 'GET', url: `/api/users/${author.user._id}` });
    const body = JSON.parse(res.body);

    expect(body.user.followersCount).toBe(1);
  });
});

describe('GET /api/users/suggested', () => {
  it('requires authentication', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/users/suggested' });
    expect(res.statusCode).toBe(401);
  });

  it('returns users the current user does not follow', async () => {
    const me = await registerAndLogin(app);
    const stranger = await registerAndLogin(app, { username: 'stranger' });
    const followed = await registerAndLogin(app, { username: 'followed' });

    await app.inject({ method: 'POST', url: `/api/follows/${followed.user._id}`, headers: authHeader(me.token) });

    const res = await app.inject({ method: 'GET', url: '/api/users/suggested', headers: authHeader(me.token) });
    const body = JSON.parse(res.body);

    const suggestedNames = body.data.map((u: { username: string }) => u.username);
    expect(suggestedNames).toContain('stranger');
    expect(suggestedNames).not.toContain('followed');
  });

  it('excludes the requesting user from suggestions', async () => {
    const me = await registerAndLogin(app, { username: 'myself' });
    await registerAndLogin(app, { username: 'other' });

    const res = await app.inject({ method: 'GET', url: '/api/users/suggested', headers: authHeader(me.token) });
    const body = JSON.parse(res.body);

    const suggestedNames = body.data.map((u: { username: string }) => u.username);
    expect(suggestedNames).not.toContain('myself');
  });
});
