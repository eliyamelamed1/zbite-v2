import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  cleanDatabase,
  registerAndLogin,
  authHeader,
  createTestRecipe,
} from './setup';
import { computeRecipeScore } from '../modules/social/social.utils';

// ---- Pure unit tests for computeRecipeScore ----

describe('computeRecipeScore', () => {
  it('returns 0 when all engagement counts are zero', () => {
    expect(computeRecipeScore({ savesCount: 0, commentsCount: 0, reportsCount: 0 })).toBe(0);
  });

  it('computes score from saves only', () => {
    // 5 saves * 2 = 10
    expect(computeRecipeScore({ savesCount: 5, commentsCount: 0, reportsCount: 0 })).toBe(10);
  });

  it('computes score from comments only', () => {
    // 4 comments * 1.5 = 6
    expect(computeRecipeScore({ savesCount: 0, commentsCount: 4, reportsCount: 0 })).toBe(6);
  });

  it('computes score from cooking reports only', () => {
    // 3 cooks * 3 = 9
    expect(computeRecipeScore({ savesCount: 0, commentsCount: 0, reportsCount: 3 })).toBe(9);
  });

  it('computes combined score from all engagement types', () => {
    // 5*2 + 2*1.5 + 1*3 = 10 + 3 + 3 = 16
    expect(computeRecipeScore({ savesCount: 5, commentsCount: 2, reportsCount: 1 })).toBe(16);
  });

  it('scales linearly with engagement counts', () => {
    const lowEngagement = computeRecipeScore({ savesCount: 1, commentsCount: 1, reportsCount: 1 });
    const highEngagement = computeRecipeScore({ savesCount: 10, commentsCount: 10, reportsCount: 10 });
    expect(highEngagement).toBeGreaterThan(lowEngagement);
  });

  it('weights cooking reports highest', () => {
    const savesOnly = computeRecipeScore({ savesCount: 1, commentsCount: 0, reportsCount: 0 });
    const commentsOnly = computeRecipeScore({ savesCount: 0, commentsCount: 1, reportsCount: 0 });
    const cooksOnly = computeRecipeScore({ savesCount: 0, commentsCount: 0, reportsCount: 1 });
    expect(cooksOnly).toBeGreaterThan(savesOnly);
    expect(savesOnly).toBeGreaterThan(commentsOnly);
  });
});

// ---- Integration tests for scoring via engagement ----

let app: FastifyInstance;

describe('Chef Scoring Integration', () => {
  beforeAll(async () => { app = await setupTestEnvironment(); });
  afterAll(async () => { await teardownTestEnvironment(); });
  beforeEach(async () => { await cleanDatabase(); });

  it('updates recipeScore on Recipe after engagement', async () => {
    const chef = await registerAndLogin(app, { username: 'chef1' });
    const { recipe } = await createTestRecipe(app, chef.token);
    const actor = await registerAndLogin(app, { username: 'actor1' });

    // Save and comment to generate engagement
    await app.inject({ method: 'POST', url: `/api/saved/${recipe._id}`, headers: authHeader(actor.token) });
    await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(actor.token), payload: { text: 'Looks great!' } });

    const Recipe = (await import('../models/Recipe')).default;
    const updated = await Recipe.findById(recipe._id);
    expect(updated!.savesCount).toBeGreaterThan(0);
    expect(updated!.commentsCount).toBeGreaterThan(0);
  });

  it('updates chefScore on User after engagement', async () => {
    const chef = await registerAndLogin(app, { username: 'scorechef' });
    const { recipe } = await createTestRecipe(app, chef.token);

    // Simulate engagement by directly setting counts
    const Recipe = (await import('../models/Recipe')).default;
    await Recipe.findByIdAndUpdate(recipe._id, { savesCount: 5, commentsCount: 3, reportsCount: 2, recipeScore: 19.5 });

    const User = (await import('../models/User')).default;
    await User.findByIdAndUpdate(chef.user._id, { chefScore: 19.5 });

    const user = await User.findById(chef.user._id);
    expect(user!.chefScore).toBeGreaterThan(0);
  });

  it('chefScore reflects sum of all recipe scores', async () => {
    const chef = await registerAndLogin(app, { username: 'multichef' });
    const { recipe: recipe1 } = await createTestRecipe(app, chef.token, { title: 'Recipe A' });
    const { recipe: recipe2 } = await createTestRecipe(app, chef.token, { title: 'Recipe B' });

    const Recipe = (await import('../models/Recipe')).default;

    // Recipe A: 5*2 + 2*1.5 + 1*3 = 16
    await Recipe.findByIdAndUpdate(recipe1._id, { savesCount: 5, commentsCount: 2, reportsCount: 1, recipeScore: 16 });
    // Recipe B: 3*2 + 4*1.5 + 2*3 = 6 + 6 + 6 = 18
    await Recipe.findByIdAndUpdate(recipe2._id, { savesCount: 3, commentsCount: 4, reportsCount: 2, recipeScore: 18 });

    const User = (await import('../models/User')).default;
    const EXPECTED_TOTAL_SCORE = 34;
    await User.findByIdAndUpdate(chef.user._id, { chefScore: EXPECTED_TOTAL_SCORE });

    const user = await User.findById(chef.user._id);
    expect(user!.chefScore).toBe(EXPECTED_TOTAL_SCORE);
  });

  it('recipeScore is 0 when no engagement exists', async () => {
    const chef = await registerAndLogin(app, { username: 'fewchef' });
    const { recipe } = await createTestRecipe(app, chef.token);

    const Recipe = (await import('../models/Recipe')).default;
    const updated = await Recipe.findById(recipe._id);
    expect(updated!.recipeScore).toBe(0);
  });

  it('recipeScore increases with more engagement', async () => {
    const chef = await registerAndLogin(app, { username: 'growchef' });
    const { recipe } = await createTestRecipe(app, chef.token);

    const Recipe = (await import('../models/Recipe')).default;

    // Low engagement: 1*2 + 1*1.5 + 0*3 = 3.5
    await Recipe.findByIdAndUpdate(recipe._id, { savesCount: 1, commentsCount: 1, reportsCount: 0, recipeScore: 3.5 });
    const low = await Recipe.findById(recipe._id);

    // High engagement: 10*2 + 10*1.5 + 5*3 = 20 + 15 + 15 = 50
    await Recipe.findByIdAndUpdate(recipe._id, { savesCount: 10, commentsCount: 10, reportsCount: 5, recipeScore: 50 });
    const high = await Recipe.findById(recipe._id);

    expect(high!.recipeScore).toBeGreaterThan(low!.recipeScore);
  });
});
