import { FastifyInstance } from 'fastify';
import Recipe from '../models/Recipe';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, createTestRecipe } from './setup';

let app: FastifyInstance;

beforeAll(async () => {
  app = await setupTestEnvironment();
  // Text search requires a text index — must be explicitly synced in the in-memory DB
  await Recipe.syncIndexes();
});
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('GET /api/recipes/search', () => {
  it('finds recipes by title', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token, { title: 'Spaghetti Bolognese' });
    await createTestRecipe(app, token, { title: 'Chicken Tikka Masala' });

    const res = await app.inject({ method: 'GET', url: '/api/recipes/search?q=spaghetti' });
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Spaghetti Bolognese');
  });

  it('finds recipes by description', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token, { title: 'Mystery Dish', description: 'A creamy mushroom risotto' });
    await createTestRecipe(app, token, { title: 'Another Dish', description: 'A spicy curry' });

    const res = await app.inject({ method: 'GET', url: '/api/recipes/search?q=risotto' });
    const body = JSON.parse(res.body);

    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe('Mystery Dish');
  });

  it('returns empty for no matches', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token, { title: 'Pizza' });

    const res = await app.inject({ method: 'GET', url: '/api/recipes/search?q=sushi' });
    const body = JSON.parse(res.body);

    expect(body.data).toHaveLength(0);
    expect(body.pagination.total).toBe(0);
  });

  it('returns pagination metadata', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token, { title: 'Pasta Recipe One' });
    await createTestRecipe(app, token, { title: 'Pasta Recipe Two' });
    await createTestRecipe(app, token, { title: 'Pasta Recipe Three' });

    const res = await app.inject({ method: 'GET', url: '/api/recipes/search?q=pasta&page=1&limit=2' });
    const body = JSON.parse(res.body);

    expect(body.data).toHaveLength(2);
    expect(body.pagination.total).toBe(3);
    expect(body.pagination.pages).toBe(2);
  });

  it('excludes draft recipes', async () => {
    const { token } = await registerAndLogin(app);
    const { recipe: published } = await createTestRecipe(app, token, { title: 'Published Pasta' });
    const Recipe = (await import('../models/Recipe')).default;

    // Get user ID
    const meRes = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { authorization: `Bearer ${token}` } });
    const userId = JSON.parse(meRes.body).user._id;

    // Create a draft directly in DB
    await Recipe.create({
      title: 'Draft Pasta',
      description: 'Work in progress',
      tags: ['Italian'],
      difficulty: 'easy',
      cookingTime: 20,
      servings: 2,
      ingredients: [{ amount: '100g', name: 'Pasta' }],
      steps: [{ order: 1, title: 'Step 1', instruction: 'Do something', image: '' }],
      nutrition: { calories: 200, protein: 10, carbs: 30, fat: 5 },
      coverImage: '/test.png',
      author: userId,
      status: 'draft',
    });

    const res = await app.inject({ method: 'GET', url: '/api/recipes/search?q=pasta' });
    const body = JSON.parse(res.body);

    const titles = body.data.map((r: { title: string }) => r.title);
    expect(titles).toContain('Published Pasta');
    expect(titles).not.toContain('Draft Pasta');
  });

  it('populates author on search results', async () => {
    const { token } = await registerAndLogin(app, { username: 'searchable_chef' });
    await createTestRecipe(app, token, { title: 'Searchable Dish' });

    const res = await app.inject({ method: 'GET', url: '/api/recipes/search?q=searchable' });
    const body = JSON.parse(res.body);

    expect(body.data[0].author).toHaveProperty('username');
    expect(body.data[0].author.username).toBe('searchable_chef');
  });

  it('is accessible without authentication', async () => {
    const { token } = await registerAndLogin(app);
    await createTestRecipe(app, token, { title: 'Public Recipe' });

    const res = await app.inject({ method: 'GET', url: '/api/recipes/search?q=public' });
    expect(res.statusCode).toBe(200);
  });
});
