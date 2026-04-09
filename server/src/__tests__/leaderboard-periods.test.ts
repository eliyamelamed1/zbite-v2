import { FastifyInstance } from 'fastify';
import Recipe from '../models/Recipe';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, createTestRecipe } from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('Leaderboard Periods', () => {
  it('alltime returns all users with recipes', async () => {
    const user1 = await registerAndLogin(app, { username: 'chef1' });
    const user2 = await registerAndLogin(app, { username: 'chef2' });
    await createTestRecipe(app, user1.token);
    await createTestRecipe(app, user2.token);
    const res = await app.inject({ method: 'GET', url: '/api/leaderboard?period=alltime' });
    const data = JSON.parse(res.body).data;
    expect(data.length).toBeGreaterThanOrEqual(2);
  });

  it('weekly returns only users with recent recipes', async () => {
    const recent = await registerAndLogin(app, { username: 'recentchef' });
    const old = await registerAndLogin(app, { username: 'oldchef' });
    await createTestRecipe(app, recent.token);
    const { recipe: oldRecipe } = await createTestRecipe(app, old.token);
    // Push the old recipe's createdAt to 2 weeks ago
    await Recipe.collection.updateOne({ _id: oldRecipe._id }, { $set: { createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } });
    const res = await app.inject({ method: 'GET', url: '/api/leaderboard?period=weekly' });
    const data = JSON.parse(res.body).data;
    const usernames = data.map((entry: { user: { username: string } }) => entry.user.username);
    expect(usernames).toContain('recentchef');
  });

  it('weekly excludes users with only old recipes', async () => {
    const old = await registerAndLogin(app, { username: 'oldonly' });
    const { recipe: oldRecipe } = await createTestRecipe(app, old.token);
    await Recipe.collection.updateOne({ _id: oldRecipe._id }, { $set: { createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } });
    const res = await app.inject({ method: 'GET', url: '/api/leaderboard?period=weekly' });
    const data = JSON.parse(res.body).data;
    const usernames = data.map((entry: { user: { username: string } }) => entry.user.username);
    expect(usernames).not.toContain('oldonly');
  });

  it('monthly returns users within 30-day window', async () => {
    const recent = await registerAndLogin(app, { username: 'monthlychef' });
    const old = await registerAndLogin(app, { username: 'ancientchef' });
    await createTestRecipe(app, recent.token);
    const { recipe: oldRecipe } = await createTestRecipe(app, old.token);
    // Push the old recipe's createdAt to 45 days ago
    await Recipe.collection.updateOne({ _id: oldRecipe._id }, { $set: { createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) } });
    const res = await app.inject({ method: 'GET', url: '/api/leaderboard?period=monthly' });
    const data = JSON.parse(res.body).data;
    const usernames = data.map((entry: { user: { username: string } }) => entry.user.username);
    expect(usernames).toContain('monthlychef');
    expect(usernames).not.toContain('ancientchef');
  });
});
