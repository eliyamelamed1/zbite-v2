import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, createTestRecipe, authHeader } from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('Recipe creation (via DB helper)', () => {
  it('creates a recipe with correct fields', async () => {
    const { token } = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, token, { title: 'Pasta Carbonara' });
    expect(recipe.title).toBe('Pasta Carbonara');
    expect(recipe.coverImage).toBeTruthy();
    expect(recipe.author.username).toBeTruthy();
    expect(recipe.ingredients).toHaveLength(2);
    expect(recipe.steps).toHaveLength(2);
  });

  it('increments recipesCount', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token);
    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: authHeader(token) });
    expect(JSON.parse(me.body).user.recipesCount).toBe(1);
  });
});

describe('GET /api/recipes/explore', () => {
  it('returns recipes', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token, { title: 'First' });
    await createTestRecipe(app, token, { title: 'Second' });
    const res = await app.inject({ method: 'GET', url: '/api/recipes/explore' });
    const body = JSON.parse(res.body);
    expect(body.data).toHaveLength(2);
    expect(body.pagination.total).toBe(2);
  });

  it('filters by category', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token, { category: 'Italian' });
    await createTestRecipe(app, token, { category: 'Asian' });
    const res = await app.inject({ method: 'GET', url: '/api/recipes/explore?category=Italian' });
    expect(JSON.parse(res.body).data).toHaveLength(1);
  });

  it('filters quick recipes', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token, { cookingTime: 15 });
    await createTestRecipe(app, token, { cookingTime: 60 });
    const res = await app.inject({ method: 'GET', url: '/api/recipes/explore?sort=quick' });
    expect(JSON.parse(res.body).data).toHaveLength(1);
  });
});

describe('GET /api/recipes/following', () => {
  it('returns followed users recipes', async () => {
    const author = await registerAndLogin(app, { username: 'author' });
    const follower = await registerAndLogin(app, { username: 'follower' });
    await createTestRecipe(app, author.token);
    await app.inject({ method: 'POST', url: `/api/follows/${author.user._id}`, headers: authHeader(follower.token) });
    const res = await app.inject({ method: 'GET', url: '/api/recipes/following', headers: authHeader(follower.token) });
    expect(JSON.parse(res.body).data).toHaveLength(1);
  });

  it('returns empty when not following anyone', async () => {
    const { token } = await registerAndLogin(app);
    const res = await app.inject({ method: 'GET', url: '/api/recipes/following', headers: authHeader(token) });
    expect(JSON.parse(res.body).data).toHaveLength(0);
  });
});

describe('GET /api/recipes/:id', () => {
  it('returns a recipe with populated author', async () => {
    const { token } = await registerAndLogin(app, { username: 'chef' });
    const { recipe } = await createTestRecipe(app, token);
    const res = await app.inject({ method: 'GET', url: `/api/recipes/${recipe._id}` });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).recipe.author.username).toBe('chef');
  });

  it('returns 404 for non-existent ID', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await app.inject({ method: 'GET', url: `/api/recipes/${fakeId}` });
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/recipes/user/:userId', () => {
  it('returns only that users recipes', async () => {
    const user1 = await registerAndLogin(app);
    const user2 = await registerAndLogin(app);
    await createTestRecipe(app, user1.token);
    await createTestRecipe(app, user1.token);
    await createTestRecipe(app, user2.token);
    const res = await app.inject({ method: 'GET', url: `/api/recipes/user/${user1.user._id}` });
    expect(JSON.parse(res.body).data).toHaveLength(2);
  });
});

describe('DELETE /api/recipes/:id', () => {
  it('author can delete', async () => {
    const { token } = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, token);
    const res = await app.inject({ method: 'DELETE', url: `/api/recipes/${recipe._id}`, headers: authHeader(token) });
    expect(res.statusCode).toBe(200);
  });

  it('non-author gets 403', async () => {
    const author = await registerAndLogin(app);
    const other = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);
    const res = await app.inject({ method: 'DELETE', url: `/api/recipes/${recipe._id}`, headers: authHeader(other.token) });
    expect(res.statusCode).toBe(403);
  });
});
