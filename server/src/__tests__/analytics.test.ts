import { FastifyInstance } from 'fastify';
import Recipe from '../models/Recipe';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, createTestRecipe, authHeader } from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('Analytics', () => {
  it('returns overview stats for authenticated user with recipes', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token);
    await createTestRecipe(app, token);
    const res = await app.inject({ method: 'GET', url: '/api/analytics/overview', headers: authHeader(token) });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.totalRecipes).toBe(2);
    expect(body).toHaveProperty('totalLikes');
    expect(body).toHaveProperty('totalComments');
    expect(body).toHaveProperty('totalSaves');
  });

  it('returns empty stats for user with no recipes', async () => {
    const { token } = await registerAndLogin(app);
    const res = await app.inject({ method: 'GET', url: '/api/analytics/overview', headers: authHeader(token) });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.totalRecipes).toBe(0);
  });

  it('returns per-recipe performance sorted by likes', async () => {
    const { token } = await registerAndLogin(app);
    const { recipe: r1 } = await createTestRecipe(app, token, { title: 'Low Likes' });
    const { recipe: r2 } = await createTestRecipe(app, token, { title: 'High Likes' });
    // Manually set likesCount to control sort order
    await Recipe.findByIdAndUpdate(r1._id, { likesCount: 1 });
    await Recipe.findByIdAndUpdate(r2._id, { likesCount: 10 });
    const res = await app.inject({ method: 'GET', url: '/api/analytics/recipes', headers: authHeader(token) });
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body).data;
    expect(data.length).toBe(2);
    expect(data[0].likesCount).toBeGreaterThanOrEqual(data[1].likesCount);
  });

  it('returns daily engagement time-series', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token);
    const res = await app.inject({ method: 'GET', url: '/api/analytics/engagement?days=7', headers: authHeader(token) });
    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.body).data;
    expect(Array.isArray(data)).toBe(true);
  });

  it('requires authentication', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/analytics/overview' });
    expect(res.statusCode).toBe(401);
  });

  it('viewsCount increments when recipe is viewed', async () => {
    const { token } = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, token);
    // View the recipe via the public endpoint
    await app.inject({ method: 'GET', url: `/api/recipes/${recipe._id}` });
    // Small delay for fire-and-forget update
    await new Promise((resolve) => { setTimeout(resolve, 200); });
    const updatedRecipe = await Recipe.findById(recipe._id);
    expect(updatedRecipe!.viewsCount).toBeGreaterThan(0);
  });
});
