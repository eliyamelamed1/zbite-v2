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

// ---------------------------------------------------------------------------
// Path A — Category-based ("Help Me Decide")
// ---------------------------------------------------------------------------

describe('GET /api/recipes/recommend?mode=pick', () => {
  it('filters by category — returns recipes with matching cat: system tag', async () => {
    const { token } = await registerAndLogin(app);
    // "chicken breast" triggers cat:chicken auto-tag via pre('save') hook
    await createTestRecipe(app, token, { title: 'Chicken Dish' });
    await createTestRecipe(app, token, { title: 'Pasta Dish' });

    // Manually set systemTags to simulate auto-tagging
    const Recipe = mongoose.model('Recipe');
    const chicken = await Recipe.findOne({ title: 'Chicken Dish' });
    await Recipe.findByIdAndUpdate(chicken!._id, { $addToSet: { systemTags: 'cat:chicken' } });
    const pasta = await Recipe.findOne({ title: 'Pasta Dish' });
    await Recipe.findByIdAndUpdate(pasta!._id, { $addToSet: { systemTags: 'cat:pasta' } });

    const res = await app.inject({
      method: 'GET',
      url: '/api/recipes/recommend?mode=pick&category=chicken',
    });
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Chicken Dish');
  });

  it('filters by time range', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token, { title: 'Quick', cookingTime: 20 });
    await createTestRecipe(app, token, { title: 'Slow', cookingTime: 90 });

    const Recipe = mongoose.model('Recipe');
    await Recipe.updateMany({}, { $addToSet: { systemTags: 'cat:chicken' } });

    const res = await app.inject({
      method: 'GET',
      url: '/api/recipes/recommend?mode=pick&category=chicken&minTime=15&maxTime=30',
    });
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Quick');
  });

  it('filters by preference — family-friendly requires servings >= 4', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token, { title: 'Big', servings: 6 });
    await createTestRecipe(app, token, { title: 'Small', servings: 2 });

    const Recipe = mongoose.model('Recipe');
    await Recipe.updateMany({}, { $addToSet: { systemTags: 'cat:chicken' } });

    const res = await app.inject({
      method: 'GET',
      url: '/api/recipes/recommend?mode=pick&category=chicken&preference=family-friendly',
    });
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Big');
  });

  it('returns empty when no recipes match', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/recipes/recommend?mode=pick&category=seafood',
    });
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.data).toHaveLength(0);
  });

  it('defaults to 4 results per page', async () => {
    const { token } = await registerAndLogin(app);
    for (let i = 0; i < 6; i++) {
      await createTestRecipe(app, token, { title: `R${i}` });
    }

    const Recipe = mongoose.model('Recipe');
    await Recipe.updateMany({}, { $addToSet: { systemTags: 'cat:chicken' } });

    const res = await app.inject({
      method: 'GET',
      url: '/api/recipes/recommend?mode=pick&category=chicken',
    });
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.data.length).toBeLessThanOrEqual(4);
    expect(body.pagination.total).toBe(6);
  });

  it('works without authentication (public via optionalAuth)', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token, { title: 'Public' });

    const Recipe = mongoose.model('Recipe');
    await Recipe.updateMany({}, { $addToSet: { systemTags: 'cat:pasta' } });

    const res = await app.inject({
      method: 'GET',
      url: '/api/recipes/recommend?mode=pick&category=pasta',
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Path B — Ingredient-based ("Use What I Have")
// ---------------------------------------------------------------------------

describe('GET /api/recipes/recommend?mode=pantry', () => {
  it('matches recipes by ingredient overlap', async () => {
    const { token } = await registerAndLogin(app);
    // Default recipe has "Test Ingredient" and "Another Ingredient"
    await createTestRecipe(app, token, { title: 'Match' });
    await createTestRecipe(app, token, { title: 'No Match' });

    // Manually set ingredients to control matching
    const Recipe = mongoose.model('Recipe');
    await Recipe.findOneAndUpdate({ title: 'Match' }, {
      ingredients: [
        { name: 'chicken breast', amount: '500g' },
        { name: 'jasmine rice', amount: '2 cups' },
        { name: 'garlic', amount: '3 cloves' },
      ],
    });
    await Recipe.findOneAndUpdate({ title: 'No Match' }, {
      ingredients: [
        { name: 'beef steak', amount: '300g' },
        { name: 'potatoes', amount: '500g' },
      ],
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/recipes/recommend?mode=pantry&ingredients=chicken,rice,garlic',
    });
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Match');
  });

  it('sorts by match count descending', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token, { title: 'Best' });
    await createTestRecipe(app, token, { title: 'Ok' });

    const Recipe = mongoose.model('Recipe');
    await Recipe.findOneAndUpdate({ title: 'Best' }, {
      ingredients: [
        { name: 'chicken breast', amount: '500g' },
        { name: 'jasmine rice', amount: '2 cups' },
        { name: 'garlic cloves', amount: '3' },
      ],
    });
    await Recipe.findOneAndUpdate({ title: 'Ok' }, {
      ingredients: [
        { name: 'chicken thigh', amount: '400g' },
        { name: 'lemon', amount: '1' },
      ],
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/recipes/recommend?mode=pantry&ingredients=chicken,rice,garlic',
    });
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.data.length).toBeGreaterThanOrEqual(2);
    expect(body.data[0].title).toBe('Best');
    expect(body.data[1].title).toBe('Ok');
  });

  it('applies time constraint on top of ingredient filter', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token, { title: 'Quick', cookingTime: 15 });
    await createTestRecipe(app, token, { title: 'Slow', cookingTime: 90 });

    const Recipe = mongoose.model('Recipe');
    await Recipe.updateMany({}, {
      ingredients: [{ name: 'chicken breast', amount: '500g' }],
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/recipes/recommend?mode=pantry&ingredients=chicken&maxTime=30',
    });
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Quick');
  });

  it('returns empty when no ingredients match', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token, { title: 'No Match' });

    const res = await app.inject({
      method: 'GET',
      url: '/api/recipes/recommend?mode=pantry&ingredients=truffle,saffron',
    });
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.data).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// "Your Go-To" (usuals) in decider results
// ---------------------------------------------------------------------------

describe('Usuals in /api/recipes/recommend', () => {
  it('returns usuals for authenticated user who has saved matching recipes', async () => {
    const { token, user } = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, token, { title: 'Saved Recipe' });

    // Save the recipe
    await app.inject({
      method: 'POST',
      url: `/api/saved/${recipe._id}`,
      headers: authHeader(token),
    });

    // Tag it for category matching
    const Recipe = mongoose.model('Recipe');
    await Recipe.findByIdAndUpdate(recipe._id, {
      $addToSet: { systemTags: 'cat:chicken' },
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/recipes/recommend?mode=pick&category=chicken',
      headers: authHeader(token),
    });
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.usuals).toBeDefined();
    expect(body.usuals.length).toBeGreaterThanOrEqual(1);
    expect(body.usuals[0].title).toBe('Saved Recipe');
  });

  it('returns empty usuals for guest users', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token);

    const Recipe = mongoose.model('Recipe');
    await Recipe.updateMany({}, { $addToSet: { systemTags: 'cat:chicken' } });

    const res = await app.inject({
      method: 'GET',
      url: '/api/recipes/recommend?mode=pick&category=chicken',
    });
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.usuals).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Auto-tagging via pre('save') hook
// ---------------------------------------------------------------------------

describe('System tag auto-tagging', () => {
  it('assigns cat: tags based on ingredient names on recipe create', async () => {
    const { token } = await registerAndLogin(app);

    // createTestRecipe uses "Test Ingredient" and "Another Ingredient"
    // which won't match any category. Let's create one with real ingredients.
    const Recipe = mongoose.model('Recipe');
    const meRes = await app.inject({ method: 'GET', url: '/api/auth/me', headers: authHeader(token) });
    const userId = JSON.parse(meRes.body).user._id;

    const recipe = await Recipe.create({
      title: 'Spaghetti Bolognese',
      description: 'Classic Italian pasta',
      tags: ['Italian'],
      difficulty: 'medium',
      cookingTime: 45,
      servings: 4,
      ingredients: [
        { name: 'spaghetti', amount: '400g' },
        { name: 'ground beef', amount: '500g' },
        { name: 'tomato sauce', amount: '2 cups' },
      ],
      steps: [{ order: 1, title: 'Cook', instruction: 'Cook the pasta', image: '' }],
      nutrition: { calories: 500, protein: 30, carbs: 60, fat: 15 },
      coverImage: '/uploads/test.png',
      author: userId,
    });

    expect(recipe.systemTags).toContain('cat:pasta');
    expect(recipe.systemTags).toContain('cat:beef');
  });
});
