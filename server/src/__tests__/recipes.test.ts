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

  it('filters by tag', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token, { tags: ['Italian'] });
    await createTestRecipe(app, token, { tags: ['Asian'] });
    const res = await app.inject({ method: 'GET', url: '/api/recipes/explore?tag=Italian' });
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

describe('GET /api/recipes/:id/related', () => {
  it('returns recipes with overlapping tags', async () => {
    const { token } = await registerAndLogin(app);
    const { recipe: target } = await createTestRecipe(app, token, { title: 'Pasta A', tags: ['Italian', 'Pasta'] });
    await createTestRecipe(app, token, { title: 'Pasta B', tags: ['Italian'] });
    await createTestRecipe(app, token, { title: 'Sushi', tags: ['Japanese'] });

    const res = await app.inject({ method: 'GET', url: `/api/recipes/${target._id}/related` });
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    const titles = body.data.map((r: { title: string }) => r.title);
    expect(titles).toContain('Pasta B');
    expect(titles).not.toContain('Sushi');
  });

  it('excludes the source recipe from results', async () => {
    const { token } = await registerAndLogin(app);
    const { recipe: target } = await createTestRecipe(app, token, { title: 'Target', tags: ['Italian'] });
    await createTestRecipe(app, token, { title: 'Other', tags: ['Italian'] });

    const res = await app.inject({ method: 'GET', url: `/api/recipes/${target._id}/related` });
    const body = JSON.parse(res.body);

    const ids = body.data.map((r: { _id: string }) => r._id);
    expect(ids).not.toContain(target._id);
  });

  it('returns empty array when no tags match', async () => {
    const { token } = await registerAndLogin(app);
    const { recipe: target } = await createTestRecipe(app, token, { title: 'Unique', tags: ['Mexican'] });
    await createTestRecipe(app, token, { title: 'Italian', tags: ['Italian'] });

    const res = await app.inject({ method: 'GET', url: `/api/recipes/${target._id}/related` });
    const body = JSON.parse(res.body);

    expect(body.data).toHaveLength(0);
  });

  it('returns 404 for non-existent recipe', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await app.inject({ method: 'GET', url: `/api/recipes/${fakeId}/related` });
    expect(res.statusCode).toBe(404);
  });

  it('populates author on related results', async () => {
    const { token } = await registerAndLogin(app, { username: 'chef_related' });
    const { recipe: target } = await createTestRecipe(app, token, { title: 'A', tags: ['Italian'] });
    await createTestRecipe(app, token, { title: 'B', tags: ['Italian'] });

    const res = await app.inject({ method: 'GET', url: `/api/recipes/${target._id}/related` });
    const body = JSON.parse(res.body);

    expect(body.data[0].author).toHaveProperty('username');
    expect(body.data[0].author.username).toBe('chef_related');
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
