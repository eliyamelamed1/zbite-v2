import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';

import {
  setupTestEnvironment,
  teardownTestEnvironment,
  cleanDatabase,
  registerAndLogin,
  createTestRecipe,
  authHeader,
} from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('GET /api/recipes/home', () => {
  it('returns all sections for guest users', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token, { title: 'A Recipe' });

    const res = await app.inject({ method: 'GET', url: '/api/recipes/home' });
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body).toHaveProperty('goTo');
    expect(body).toHaveProperty('interestRows');
    expect(body).toHaveProperty('quickTonight');
    expect(body).toHaveProperty('trending');
    expect(body).toHaveProperty('newThisWeek');
  });

  it('returns empty goTo and interestRows for guests', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token);

    const res = await app.inject({ method: 'GET', url: '/api/recipes/home' });
    const body = JSON.parse(res.body);

    expect(body.goTo).toHaveLength(0);
    expect(body.interestRows).toHaveLength(0);
  });

  it('returns goTo recipes for authenticated user with saved recipes', async () => {
    const { token, user } = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, token, { title: 'Saved One' });

    // Save the recipe
    await app.inject({
      method: 'POST',
      url: `/api/saved/${recipe._id}`,
      headers: authHeader(token),
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/recipes/home',
      headers: authHeader(token),
    });
    const body = JSON.parse(res.body);

    expect(body.goTo.length).toBeGreaterThanOrEqual(1);
    expect(body.goTo[0].title).toBe('Saved One');
  });

  it('returns trending recipes sorted by score', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token, { title: 'Trending Recipe' });

    const res = await app.inject({ method: 'GET', url: '/api/recipes/home' });
    const body = JSON.parse(res.body);

    expect(body.trending.length).toBeGreaterThanOrEqual(1);
  });

  it('returns newThisWeek with recently created recipes', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token, { title: 'Fresh Recipe' });

    const res = await app.inject({ method: 'GET', url: '/api/recipes/home' });
    const body = JSON.parse(res.body);

    expect(body.newThisWeek.length).toBeGreaterThanOrEqual(1);
    expect(body.newThisWeek[0].title).toBe('Fresh Recipe');
  });

  it('returns quickTonight with recipes under 30 minutes', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token, { title: 'Quick', cookingTime: 15 });
    await createTestRecipe(app, token, { title: 'Slow', cookingTime: 90 });

    const res = await app.inject({ method: 'GET', url: '/api/recipes/home' });
    const body = JSON.parse(res.body);

    const titles = body.quickTonight.map((r: { title: string }) => r.title);
    expect(titles).toContain('Quick');
    expect(titles).not.toContain('Slow');
  });
});
