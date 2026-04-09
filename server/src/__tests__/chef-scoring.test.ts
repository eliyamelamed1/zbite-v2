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
  it('returns 0 when ratingsCount is below threshold', () => {
    expect(computeRecipeScore(5.0, 0)).toBe(0);
    expect(computeRecipeScore(5.0, 1)).toBe(0);
    expect(computeRecipeScore(5.0, 2)).toBe(0);
  });

  it('returns 0 for a neutral average of 3.0', () => {
    expect(computeRecipeScore(3.0, 100)).toBe(0);
    expect(computeRecipeScore(3.0, 1000)).toBe(0);
  });

  it('returns positive score for above-average ratings', () => {
    const score = computeRecipeScore(4.5, 500);
    expect(score).toBeGreaterThan(0);
  });

  it('returns negative score for below-average ratings', () => {
    const score = computeRecipeScore(2.0, 100);
    expect(score).toBeLessThan(0);
  });

  it('scales with confidence — more ratings means higher magnitude', () => {
    const fewRatings = computeRecipeScore(4.5, 3);
    const manyRatings = computeRecipeScore(4.5, 500);
    expect(manyRatings).toBeGreaterThan(fewRatings);
  });

  it('penalizes bad recipes more with more ratings', () => {
    const fewBad = computeRecipeScore(1.5, 3);
    const manyBad = computeRecipeScore(1.5, 100);
    expect(manyBad).toBeLessThan(fewBad);
  });
});

// ---- Integration tests for scoring via the rate API ----

let app: FastifyInstance;

describe('Chef Scoring Integration', () => {
  beforeAll(async () => { app = await setupTestEnvironment(); });
  afterAll(async () => { await teardownTestEnvironment(); });
  beforeEach(async () => { await cleanDatabase(); });

  it('updates recipeScore on Recipe after rating threshold is met', async () => {
    const chef = await registerAndLogin(app, { username: 'chef1' });
    const { recipe } = await createTestRecipe(app, chef.token);

    // Rate with 3 different users to reach threshold
    const rater1 = await registerAndLogin(app, { username: 'rater1' });
    const rater2 = await registerAndLogin(app, { username: 'rater2' });
    const rater3 = await registerAndLogin(app, { username: 'rater3' });

    const FOUR_STARS = 4;
    for (const rater of [rater1, rater2, rater3]) {
      await app.inject({
        method: 'POST',
        url: `/api/ratings/${recipe._id}`,
        headers: authHeader(rater.token),
        payload: { stars: FOUR_STARS },
      });
    }

    // Check recipe has a positive recipeScore
    const Recipe = (await import('../models/Recipe')).default;
    const updated = await Recipe.findById(recipe._id);
    expect(updated!.recipeScore).toBeGreaterThan(0);
  });

  it('updates chefScore on User after rating', async () => {
    const chef = await registerAndLogin(app, { username: 'scorechef' });
    const { recipe } = await createTestRecipe(app, chef.token);

    const rater1 = await registerAndLogin(app, { username: 'srater1' });
    const rater2 = await registerAndLogin(app, { username: 'srater2' });
    const rater3 = await registerAndLogin(app, { username: 'srater3' });

    const FIVE_STARS = 5;
    for (const rater of [rater1, rater2, rater3]) {
      await app.inject({
        method: 'POST',
        url: `/api/ratings/${recipe._id}`,
        headers: authHeader(rater.token),
        payload: { stars: FIVE_STARS },
      });
    }

    // Check user has a positive chefScore
    const User = (await import('../models/User')).default;
    const user = await User.findById(chef.user._id);
    expect(user!.chefScore).toBeGreaterThan(0);
  });

  it('chefScore reflects sum of all recipe scores', async () => {
    const chef = await registerAndLogin(app, { username: 'multichef' });
    const { recipe: recipe1 } = await createTestRecipe(app, chef.token, { title: 'Recipe A' });
    const { recipe: recipe2 } = await createTestRecipe(app, chef.token, { title: 'Recipe B' });

    const raters = await Promise.all(
      ['mr1', 'mr2', 'mr3'].map((u) => registerAndLogin(app, { username: u })),
    );

    const FOUR_STARS = 4;
    const FIVE_STARS = 5;

    // Rate recipe1 with 4 stars
    for (const rater of raters) {
      await app.inject({
        method: 'POST',
        url: `/api/ratings/${recipe1._id}`,
        headers: authHeader(rater.token),
        payload: { stars: FOUR_STARS },
      });
    }

    // Rate recipe2 with 5 stars
    for (const rater of raters) {
      await app.inject({
        method: 'POST',
        url: `/api/ratings/${recipe2._id}`,
        headers: authHeader(rater.token),
        payload: { stars: FIVE_STARS },
      });
    }

    const Recipe = (await import('../models/Recipe')).default;
    const r1 = await Recipe.findById(recipe1._id);
    const r2 = await Recipe.findById(recipe2._id);

    const User = (await import('../models/User')).default;
    const user = await User.findById(chef.user._id);

    const expectedTotal = r1!.recipeScore + r2!.recipeScore;
    expect(user!.chefScore).toBeCloseTo(expectedTotal, 1);
  });

  it('recipeScore stays 0 when fewer than 3 ratings', async () => {
    const chef = await registerAndLogin(app, { username: 'fewchef' });
    const { recipe } = await createTestRecipe(app, chef.token);

    const rater1 = await registerAndLogin(app, { username: 'fr1' });
    const rater2 = await registerAndLogin(app, { username: 'fr2' });

    const FIVE_STARS = 5;
    for (const rater of [rater1, rater2]) {
      await app.inject({
        method: 'POST',
        url: `/api/ratings/${recipe._id}`,
        headers: authHeader(rater.token),
        payload: { stars: FIVE_STARS },
      });
    }

    const Recipe = (await import('../models/Recipe')).default;
    const updated = await Recipe.findById(recipe._id);
    expect(updated!.recipeScore).toBe(0);
  });

  it('negative ratings produce negative recipeScore', async () => {
    const chef = await registerAndLogin(app, { username: 'badchef' });
    const { recipe } = await createTestRecipe(app, chef.token);

    const raters = await Promise.all(
      ['br1', 'br2', 'br3'].map((u) => registerAndLogin(app, { username: u })),
    );

    const ONE_STAR = 1;
    for (const rater of raters) {
      await app.inject({
        method: 'POST',
        url: `/api/ratings/${recipe._id}`,
        headers: authHeader(rater.token),
        payload: { stars: ONE_STAR },
      });
    }

    const Recipe = (await import('../models/Recipe')).default;
    const updated = await Recipe.findById(recipe._id);
    expect(updated!.recipeScore).toBeLessThan(0);
  });
});
