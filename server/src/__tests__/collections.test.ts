import { FastifyInstance } from 'fastify';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, createTestRecipe, authHeader } from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('Collections', () => {
  it('creates a collection', async () => {
    const { token } = await registerAndLogin(app);
    const res = await app.inject({ method: 'POST', url: '/api/collections', headers: authHeader(token), payload: { name: 'Weeknight Dinners' } });
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).name).toBe('Weeknight Dinners');
  });

  it('lists user collections', async () => {
    const { token } = await registerAndLogin(app);
    await app.inject({ method: 'POST', url: '/api/collections', headers: authHeader(token), payload: { name: 'Collection A' } });
    await app.inject({ method: 'POST', url: '/api/collections', headers: authHeader(token), payload: { name: 'Collection B' } });
    const res = await app.inject({ method: 'GET', url: '/api/collections', headers: authHeader(token) });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toHaveLength(2);
  });

  it('gets collection with populated recipes', async () => {
    const { token } = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, token);
    const createRes = await app.inject({ method: 'POST', url: '/api/collections', headers: authHeader(token), payload: { name: 'Favorites' } });
    const collection = JSON.parse(createRes.body);
    await app.inject({ method: 'POST', url: `/api/collections/${collection._id}/recipes/${recipe._id}`, headers: authHeader(token) });
    const res = await app.inject({ method: 'GET', url: `/api/collections/${collection._id}`, headers: authHeader(token) });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).recipes).toHaveLength(1);
  });

  it('updates collection name', async () => {
    const { token } = await registerAndLogin(app);
    const createRes = await app.inject({ method: 'POST', url: '/api/collections', headers: authHeader(token), payload: { name: 'Old Name' } });
    const collection = JSON.parse(createRes.body);
    const res = await app.inject({ method: 'PUT', url: `/api/collections/${collection._id}`, headers: authHeader(token), payload: { name: 'Updated' } });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).name).toBe('Updated');
  });

  it('adds a recipe to collection', async () => {
    const { token } = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, token);
    const createRes = await app.inject({ method: 'POST', url: '/api/collections', headers: authHeader(token), payload: { name: 'My Collection' } });
    const collection = JSON.parse(createRes.body);
    const res = await app.inject({ method: 'POST', url: `/api/collections/${collection._id}/recipes/${recipe._id}`, headers: authHeader(token) });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).recipes).toContain(recipe._id.toString());
  });

  it('prevents duplicate recipe in same collection', async () => {
    const { token } = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, token);
    const createRes = await app.inject({ method: 'POST', url: '/api/collections', headers: authHeader(token), payload: { name: 'My Collection' } });
    const collection = JSON.parse(createRes.body);
    await app.inject({ method: 'POST', url: `/api/collections/${collection._id}/recipes/${recipe._id}`, headers: authHeader(token) });
    const res = await app.inject({ method: 'POST', url: `/api/collections/${collection._id}/recipes/${recipe._id}`, headers: authHeader(token) });
    expect(res.statusCode).toBe(409);
  });

  it('removes recipe from collection', async () => {
    const { token } = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, token);
    const createRes = await app.inject({ method: 'POST', url: '/api/collections', headers: authHeader(token), payload: { name: 'My Collection' } });
    const collection = JSON.parse(createRes.body);
    await app.inject({ method: 'POST', url: `/api/collections/${collection._id}/recipes/${recipe._id}`, headers: authHeader(token) });
    const res = await app.inject({ method: 'DELETE', url: `/api/collections/${collection._id}/recipes/${recipe._id}`, headers: authHeader(token) });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).recipes).not.toContain(recipe._id);
  });

  it('deletes a collection', async () => {
    const { token } = await registerAndLogin(app);
    const createRes = await app.inject({ method: 'POST', url: '/api/collections', headers: authHeader(token), payload: { name: 'To Delete' } });
    const collection = JSON.parse(createRes.body);
    const res = await app.inject({ method: 'DELETE', url: `/api/collections/${collection._id}`, headers: authHeader(token) });
    expect(res.statusCode).toBe(204);
  });

  it('returns 403 when editing someone elses collection', async () => {
    const owner = await registerAndLogin(app);
    const other = await registerAndLogin(app);
    const createRes = await app.inject({ method: 'POST', url: '/api/collections', headers: authHeader(owner.token), payload: { name: 'Private' } });
    const collection = JSON.parse(createRes.body);
    const res = await app.inject({ method: 'PUT', url: `/api/collections/${collection._id}`, headers: authHeader(other.token), payload: { name: 'Hacked' } });
    expect(res.statusCode).toBe(403);
  });

  it('requires authentication', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/collections' });
    expect(res.statusCode).toBe(401);
  });
});
