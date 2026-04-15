import { FastifyInstance } from 'fastify';
import Recipe from '../models/Recipe';
import User from '../models/User';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, authHeader, createTestRecipe } from './setup';

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
    const DAYS_AGO_45 = 45;
    await Recipe.collection.updateOne({ _id: oldRecipe._id }, { $set: { createdAt: new Date(Date.now() - DAYS_AGO_45 * 24 * 60 * 60 * 1000) } });
    const res = await app.inject({ method: 'GET', url: '/api/leaderboard?period=monthly' });
    const data = JSON.parse(res.body).data;
    const usernames = data.map((entry: { user: { username: string } }) => entry.user.username);
    expect(usernames).toContain('monthlychef');
    expect(usernames).not.toContain('ancientchef');
  });
});

describe('Leaderboard Score Ranking', () => {
  it('alltime ranks users by chefScore (highest first)', async () => {
    const chef1 = await registerAndLogin(app, { username: 'topchef' });
    const chef2 = await registerAndLogin(app, { username: 'midchef' });
    const { recipe: recipe1 } = await createTestRecipe(app, chef1.token);
    const { recipe: recipe2 } = await createTestRecipe(app, chef2.token);

    // Directly set recipe scores and chefScores to test leaderboard ranking
    const HIGH_SCORE = 12;
    const LOW_SCORE = 4;
    await Recipe.findByIdAndUpdate(recipe1._id, { recipeScore: HIGH_SCORE, savesCount: 3 });
    await Recipe.findByIdAndUpdate(recipe2._id, { recipeScore: LOW_SCORE, savesCount: 1 });
    await User.findByIdAndUpdate(chef1.user._id, { chefScore: HIGH_SCORE });
    await User.findByIdAndUpdate(chef2.user._id, { chefScore: LOW_SCORE });

    const res = await app.inject({ method: 'GET', url: '/api/leaderboard?period=alltime' });
    const body = JSON.parse(res.body);
    const entries = body.data;

    // topchef should be ranked first (higher chefScore)
    expect(entries[0].user.username).toBe('topchef');
    expect(entries[0].score).toBeGreaterThan(0);
  });

  it('leaderboard entries include score field', async () => {
    const chef = await registerAndLogin(app, { username: 'scorechef' });
    await createTestRecipe(app, chef.token);

    const res = await app.inject({ method: 'GET', url: '/api/leaderboard?period=alltime' });
    const body = JSON.parse(res.body);

    expect(body.data[0]).toHaveProperty('score');
    expect(body.data[0]).toHaveProperty('rank');
    expect(body.data[0]).toHaveProperty('user');
  });

  it('leaderboard entries include rank starting from 1', async () => {
    const chef1 = await registerAndLogin(app, { username: 'rankchef1' });
    const chef2 = await registerAndLogin(app, { username: 'rankchef2' });
    await createTestRecipe(app, chef1.token);
    await createTestRecipe(app, chef2.token);

    const res = await app.inject({ method: 'GET', url: '/api/leaderboard?period=alltime' });
    const body = JSON.parse(res.body);

    expect(body.data[0].rank).toBe(1);
    expect(body.data[1].rank).toBe(2);
  });
});
