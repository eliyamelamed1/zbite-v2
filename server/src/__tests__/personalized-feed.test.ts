import { FastifyInstance } from 'fastify';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, createTestRecipe, authHeader } from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('Personalized Feed', () => {
  it('returns interest-matched recipes first for authenticated user', async () => {
    const user = await registerAndLogin(app);
    // Save interests for the user
    await app.inject({ method: 'PUT', url: '/api/auth/interests', headers: authHeader(user.token), payload: { interests: ['Italian'] } });

    // Create recipes by another user in different categories
    const author = await registerAndLogin(app);
    await createTestRecipe(app, author.token, { title: 'Italian Pasta', tags: ['Italian'] });
    await createTestRecipe(app, author.token, { title: 'Asian Stir Fry', tags: ['Asian'] });

    const res = await app.inject({ method: 'GET', url: '/api/recipes/explore', headers: authHeader(user.token) });
    const data = JSON.parse(res.body).data;
    expect(data.length).toBeGreaterThanOrEqual(2);
    expect(data[0].tags).toContain('Italian');
  });

  it('falls back to trending for user with no interests', async () => {
    const user = await registerAndLogin(app);
    const author = await registerAndLogin(app);
    await createTestRecipe(app, author.token);
    const res = await app.inject({ method: 'GET', url: '/api/recipes/explore', headers: authHeader(user.token) });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.length).toBeGreaterThanOrEqual(1);
  });

  it('works normally for unauthenticated user', async () => {
    const author = await registerAndLogin(app);
    await createTestRecipe(app, author.token);
    const res = await app.inject({ method: 'GET', url: '/api/recipes/explore' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.length).toBeGreaterThanOrEqual(1);
  });
});
