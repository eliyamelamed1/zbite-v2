import { FastifyInstance } from 'fastify';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, createTestRecipe, authHeader } from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('Notification creation', () => {
  it('like creates a notification', async () => {
    const author = await registerAndLogin(app, { username: 'author' });
    const actor = await registerAndLogin(app, { username: 'liker' });
    const { recipe } = await createTestRecipe(app, author.token);
    await app.inject({ method: 'POST', url: `/api/likes/${recipe._id}`, headers: authHeader(actor.token) });

    const res = await app.inject({ method: 'GET', url: '/api/notifications', headers: authHeader(author.token) });
    const data = JSON.parse(res.body).data;
    expect(data).toHaveLength(1);
    expect(data[0].type).toBe('like');
    expect(data[0].sender.username).toBe('liker');
  });

  it('follow creates a notification', async () => {
    const user1 = await registerAndLogin(app, { username: 'followed' });
    const user2 = await registerAndLogin(app, { username: 'follower' });
    await app.inject({ method: 'POST', url: `/api/follows/${user1.user._id}`, headers: authHeader(user2.token) });

    const res = await app.inject({ method: 'GET', url: '/api/notifications', headers: authHeader(user1.token) });
    const data = JSON.parse(res.body).data;
    expect(data).toHaveLength(1);
    expect(data[0].type).toBe('follow');
  });

  it('self-action creates NO notification', async () => {
    const author = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);
    await app.inject({ method: 'POST', url: `/api/likes/${recipe._id}`, headers: authHeader(author.token) });

    const res = await app.inject({ method: 'GET', url: '/api/notifications', headers: authHeader(author.token) });
    expect(JSON.parse(res.body).data).toHaveLength(0);
  });
});

describe('GET /api/notifications/unread-count', () => {
  it('returns correct unread count', async () => {
    const author = await registerAndLogin(app);
    const actor = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);
    await app.inject({ method: 'POST', url: `/api/likes/${recipe._id}`, headers: authHeader(actor.token) });
    await app.inject({ method: 'POST', url: `/api/follows/${author.user._id}`, headers: authHeader(actor.token) });

    const res = await app.inject({ method: 'GET', url: '/api/notifications/unread-count', headers: authHeader(author.token) });
    expect(JSON.parse(res.body).count).toBe(2);
  });
});

describe('PUT /api/notifications/read', () => {
  it('marks all as read', async () => {
    const author = await registerAndLogin(app);
    const actor = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);
    await app.inject({ method: 'POST', url: `/api/likes/${recipe._id}`, headers: authHeader(actor.token) });

    await app.inject({ method: 'PUT', url: '/api/notifications/read', headers: authHeader(author.token), payload: {} });

    const res = await app.inject({ method: 'GET', url: '/api/notifications/unread-count', headers: authHeader(author.token) });
    expect(JSON.parse(res.body).count).toBe(0);
  });
});
