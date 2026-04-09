import { FastifyInstance } from 'fastify';
import CookingStreak from '../models/CookingStreak';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, authHeader } from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('Gamification', () => {
  it('returns default streak for new user', async () => {
    const { token } = await registerAndLogin(app);
    const res = await app.inject({ method: 'GET', url: '/api/gamification/streaks/me', headers: authHeader(token) });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.currentStreak).toBe(0);
    expect(body.totalCooked).toBe(0);
  });

  it('records a cook and increments totalCooked', async () => {
    const { token } = await registerAndLogin(app);
    const res = await app.inject({ method: 'POST', url: '/api/gamification/cook', headers: authHeader(token) });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.totalCooked).toBe(1);
    expect(body.currentStreak).toBe(1);
  });

  it('prevents double counting same day', async () => {
    const { token } = await registerAndLogin(app);
    await app.inject({ method: 'POST', url: '/api/gamification/cook', headers: authHeader(token) });
    const res = await app.inject({ method: 'POST', url: '/api/gamification/cook', headers: authHeader(token) });
    const body = JSON.parse(res.body);
    expect(body.totalCooked).toBe(1);
  });

  it('unlocks first_cook achievement', async () => {
    const { token } = await registerAndLogin(app);
    await app.inject({ method: 'POST', url: '/api/gamification/cook', headers: authHeader(token) });
    const res = await app.inject({ method: 'GET', url: '/api/gamification/achievements/me', headers: authHeader(token) });
    const achievements = JSON.parse(res.body);
    const types = achievements.map((a: { type: string }) => a.type);
    expect(types).toContain('first_cook');
  });

  it('returns empty achievements for new user', async () => {
    const { token } = await registerAndLogin(app);
    const res = await app.inject({ method: 'GET', url: '/api/gamification/achievements/me', headers: authHeader(token) });
    expect(JSON.parse(res.body)).toHaveLength(0);
  });

  it('streak resets after gap greater than 48 hours', async () => {
    const { token } = await registerAndLogin(app);
    // Record a cook first to create the streak record
    await app.inject({ method: 'POST', url: '/api/gamification/cook', headers: authHeader(token) });

    // Get user ID
    const meRes = await app.inject({ method: 'GET', url: '/api/auth/me', headers: authHeader(token) });
    const userId = JSON.parse(meRes.body).user._id;

    // Set lastCookDate to 3 days ago to simulate a gap
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    await CookingStreak.findOneAndUpdate({ user: userId }, { lastCookDate: threeDaysAgo });

    // Cook again — streak should reset to 1
    const res = await app.inject({ method: 'POST', url: '/api/gamification/cook', headers: authHeader(token) });
    const body = JSON.parse(res.body);
    expect(body.currentStreak).toBe(1);
  });

  it('tracks longestStreak', async () => {
    const { token } = await registerAndLogin(app);
    await app.inject({ method: 'POST', url: '/api/gamification/cook', headers: authHeader(token) });
    const res = await app.inject({ method: 'GET', url: '/api/gamification/streaks/me', headers: authHeader(token) });
    const body = JSON.parse(res.body);
    expect(body.longestStreak).toBeGreaterThanOrEqual(body.currentStreak);
  });
});
