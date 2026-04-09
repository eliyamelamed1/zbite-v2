import { FastifyInstance } from 'fastify';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, createTestRecipe, authHeader } from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('Shopping List', () => {
  it('returns empty list for new user', async () => {
    const { token } = await registerAndLogin(app);
    const res = await app.inject({ method: 'GET', url: '/api/shopping-list', headers: authHeader(token) });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.shoppingList.items).toHaveLength(0);
  });

  it('adds recipe ingredients to list', async () => {
    const { token } = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, token);
    const res = await app.inject({ method: 'POST', url: `/api/shopping-list/add-recipe/${recipe._id}`, headers: authHeader(token) });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.items).toHaveLength(2);
    expect(body.items[0].name).toBe('Test Ingredient');
    expect(body.items[1].name).toBe('Another Ingredient');
  });

  it('merges duplicate ingredients when adding same recipe twice', async () => {
    const { token } = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, token);
    await app.inject({ method: 'POST', url: `/api/shopping-list/add-recipe/${recipe._id}`, headers: authHeader(token) });
    const res = await app.inject({ method: 'POST', url: `/api/shopping-list/add-recipe/${recipe._id}`, headers: authHeader(token) });
    const body = JSON.parse(res.body);
    expect(body.items).toHaveLength(2);
  });

  it('adds ingredients from multiple recipes', async () => {
    const { token } = await registerAndLogin(app);
    const { recipe: r1 } = await createTestRecipe(app, token, { title: 'Recipe One' });
    const { recipe: r2 } = await createTestRecipe(app, token, { title: 'Recipe Two' });
    await app.inject({ method: 'POST', url: `/api/shopping-list/add-recipe/${r1._id}`, headers: authHeader(token) });
    const res = await app.inject({ method: 'POST', url: `/api/shopping-list/add-recipe/${r2._id}`, headers: authHeader(token) });
    const body = JSON.parse(res.body);
    // Both recipes share the same ingredient names, so duplicates merge
    expect(body.items).toHaveLength(2);
  });

  it('toggles item checked state', async () => {
    const { token } = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, token);
    const addRes = await app.inject({ method: 'POST', url: `/api/shopping-list/add-recipe/${recipe._id}`, headers: authHeader(token) });
    const itemId = JSON.parse(addRes.body).items[0]._id;
    const res = await app.inject({ method: 'PUT', url: `/api/shopping-list/items/${itemId}`, headers: authHeader(token), payload: { isChecked: true } });
    expect(res.statusCode).toBe(200);
    const toggled = JSON.parse(res.body).items.find((item: { _id: string }) => item._id === itemId);
    expect(toggled.isChecked).toBe(true);
  });

  it('removes a single item', async () => {
    const { token } = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, token);
    const addRes = await app.inject({ method: 'POST', url: `/api/shopping-list/add-recipe/${recipe._id}`, headers: authHeader(token) });
    const itemId = JSON.parse(addRes.body).items[0]._id;
    const res = await app.inject({ method: 'DELETE', url: `/api/shopping-list/items/${itemId}`, headers: authHeader(token) });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).items).toHaveLength(1);
  });

  it('clears all items', async () => {
    const { token } = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, token);
    await app.inject({ method: 'POST', url: `/api/shopping-list/add-recipe/${recipe._id}`, headers: authHeader(token) });
    const res = await app.inject({ method: 'DELETE', url: '/api/shopping-list', headers: authHeader(token) });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).items).toHaveLength(0);
  });

  it('returns 404 when adding non-existent recipe', async () => {
    const { token } = await registerAndLogin(app);
    const res = await app.inject({ method: 'POST', url: '/api/shopping-list/add-recipe/000000000000000000000000', headers: authHeader(token) });
    expect(res.statusCode).toBe(404);
  });

  it('requires authentication for all endpoints', async () => {
    const res1 = await app.inject({ method: 'GET', url: '/api/shopping-list' });
    expect(res1.statusCode).toBe(401);

    const res2 = await app.inject({ method: 'POST', url: '/api/shopping-list/add-recipe/000000000000000000000000' });
    expect(res2.statusCode).toBe(401);

    const res3 = await app.inject({ method: 'PUT', url: '/api/shopping-list/items/000000000000000000000000', payload: { isChecked: true } });
    expect(res3.statusCode).toBe(401);

    const res4 = await app.inject({ method: 'DELETE', url: '/api/shopping-list/items/000000000000000000000000' });
    expect(res4.statusCode).toBe(401);

    const res5 = await app.inject({ method: 'DELETE', url: '/api/shopping-list' });
    expect(res5.statusCode).toBe(401);
  });
});
