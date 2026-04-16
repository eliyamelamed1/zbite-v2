import { FastifyInstance } from 'fastify';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, createTestRecipe } from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('GET /api/leaderboard', () => {
  it('returns empty when no users have recipes', async () => {
    await registerAndLogin(app);
    const res = await app.inject({ method: 'GET', url: '/api/leaderboard' });
    expect(JSON.parse(res.body).data).toHaveLength(0);
  });

  it('returns users with recipes ranked', async () => {
    const user1 = await registerAndLogin(app, { username: 'chef1' });
    const user2 = await registerAndLogin(app, { username: 'chef2' });
    await createTestRecipe(app, user1.token);
    await createTestRecipe(app, user1.token);
    await createTestRecipe(app, user2.token);

    const res = await app.inject({ method: 'GET', url: '/api/leaderboard' });
    const data = JSON.parse(res.body).data;
    expect(data.length).toBeGreaterThanOrEqual(2);
    expect(data[0].rank).toBe(1);
    expect(data[1].rank).toBe(2);
  });

  it('excludes users with 0 recipes', async () => {
    const active = await registerAndLogin(app, { username: 'active' });
    await registerAndLogin(app, { username: 'inactive' });
    await createTestRecipe(app, active.token);

    const res = await app.inject({ method: 'GET', url: '/api/leaderboard' });
    const data = JSON.parse(res.body).data;
    expect(data).toHaveLength(1);
    expect(data[0].user.username).toBe('active');
  });
});
