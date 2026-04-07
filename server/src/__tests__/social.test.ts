import { FastifyInstance } from 'fastify';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, createTestRecipe, authHeader } from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('Likes', () => {
  it('likes a recipe', async () => {
    const author = await registerAndLogin(app);
    const actor = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);
    const res = await app.inject({ method: 'POST', url: `/api/likes/${recipe._id}`, headers: authHeader(actor.token) });
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).liked).toBe(true);
  });

  it('rejects duplicate like', async () => {
    const author = await registerAndLogin(app);
    const actor = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);
    await app.inject({ method: 'POST', url: `/api/likes/${recipe._id}`, headers: authHeader(actor.token) });
    const res = await app.inject({ method: 'POST', url: `/api/likes/${recipe._id}`, headers: authHeader(actor.token) });
    expect(res.statusCode).toBe(409);
  });

  it('checks like status', async () => {
    const author = await registerAndLogin(app);
    const actor = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);
    await app.inject({ method: 'POST', url: `/api/likes/${recipe._id}`, headers: authHeader(actor.token) });
    const res = await app.inject({ method: 'GET', url: `/api/likes/${recipe._id}/status`, headers: authHeader(actor.token) });
    expect(JSON.parse(res.body).liked).toBe(true);
  });

  it('unlikes a recipe', async () => {
    const author = await registerAndLogin(app);
    const actor = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);
    await app.inject({ method: 'POST', url: `/api/likes/${recipe._id}`, headers: authHeader(actor.token) });
    const res = await app.inject({ method: 'DELETE', url: `/api/likes/${recipe._id}`, headers: authHeader(actor.token) });
    expect(JSON.parse(res.body).liked).toBe(false);
  });

  it('bulk status check', async () => {
    const author = await registerAndLogin(app);
    const actor = await registerAndLogin(app);
    const { recipe: r1 } = await createTestRecipe(app, author.token);
    const { recipe: r2 } = await createTestRecipe(app, author.token);
    await app.inject({ method: 'POST', url: `/api/likes/${r1._id}`, headers: authHeader(actor.token) });
    const res = await app.inject({ method: 'POST', url: '/api/likes/bulk-status', headers: authHeader(actor.token), payload: { recipeIds: [r1._id, r2._id] } });
    const map = JSON.parse(res.body).likedMap;
    expect(map[r1._id]).toBe(true);
    expect(map[r2._id]).toBe(false);
  });
});

describe('Comments', () => {
  it('creates a comment', async () => {
    const author = await registerAndLogin(app);
    const actor = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);
    const res = await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(actor.token), payload: { text: 'Great recipe!' } });
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).comment.text).toBe('Great recipe!');
    expect(JSON.parse(res.body).comment.user.username).toBeTruthy();
  });

  it('lists comments', async () => {
    const author = await registerAndLogin(app);
    const actor = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);
    await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(actor.token), payload: { text: 'Comment 1' } });
    const res = await app.inject({ method: 'GET', url: `/api/comments/${recipe._id}` });
    expect(JSON.parse(res.body).data).toHaveLength(1);
  });

  it('rejects empty comment', async () => {
    const author = await registerAndLogin(app);
    const actor = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);
    const res = await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(actor.token), payload: { text: '' } });
    expect(res.statusCode).toBe(400);
  });
});

describe('Ratings', () => {
  it('rates a recipe', async () => {
    const author = await registerAndLogin(app);
    const actor = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);
    const res = await app.inject({ method: 'POST', url: `/api/ratings/${recipe._id}`, headers: authHeader(actor.token), payload: { stars: 4 } });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).averageRating).toBe(4);
    expect(JSON.parse(res.body).ratingsCount).toBe(1);
  });

  it('upserts same user rating', async () => {
    const author = await registerAndLogin(app);
    const actor = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);
    await app.inject({ method: 'POST', url: `/api/ratings/${recipe._id}`, headers: authHeader(actor.token), payload: { stars: 3 } });
    const res = await app.inject({ method: 'POST', url: `/api/ratings/${recipe._id}`, headers: authHeader(actor.token), payload: { stars: 5 } });
    expect(JSON.parse(res.body).ratingsCount).toBe(1);
    expect(JSON.parse(res.body).averageRating).toBe(5);
  });

  it('gets my rating', async () => {
    const author = await registerAndLogin(app);
    const actor = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);
    await app.inject({ method: 'POST', url: `/api/ratings/${recipe._id}`, headers: authHeader(actor.token), payload: { stars: 4 } });
    const res = await app.inject({ method: 'GET', url: `/api/ratings/${recipe._id}/me`, headers: authHeader(actor.token) });
    expect(JSON.parse(res.body).rating).toBe(4);
  });

  it('rejects invalid stars', async () => {
    const author = await registerAndLogin(app);
    const actor = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);
    const res = await app.inject({ method: 'POST', url: `/api/ratings/${recipe._id}`, headers: authHeader(actor.token), payload: { stars: 6 } });
    expect(res.statusCode).toBe(400);
  });
});

describe('Saved', () => {
  it('saves a recipe', async () => {
    const author = await registerAndLogin(app);
    const actor = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);
    const res = await app.inject({ method: 'POST', url: `/api/saved/${recipe._id}`, headers: authHeader(actor.token) });
    expect(res.statusCode).toBe(201);
  });

  it('lists saved recipes', async () => {
    const author = await registerAndLogin(app);
    const actor = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);
    await app.inject({ method: 'POST', url: `/api/saved/${recipe._id}`, headers: authHeader(actor.token) });
    const res = await app.inject({ method: 'GET', url: '/api/saved', headers: authHeader(actor.token) });
    expect(JSON.parse(res.body).data).toHaveLength(1);
  });

  it('unsaves a recipe', async () => {
    const author = await registerAndLogin(app);
    const actor = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);
    await app.inject({ method: 'POST', url: `/api/saved/${recipe._id}`, headers: authHeader(actor.token) });
    const res = await app.inject({ method: 'DELETE', url: `/api/saved/${recipe._id}`, headers: authHeader(actor.token) });
    expect(JSON.parse(res.body).saved).toBe(false);
  });
});

describe('Follows', () => {
  it('follows a user', async () => {
    const user1 = await registerAndLogin(app);
    const user2 = await registerAndLogin(app);
    const res = await app.inject({ method: 'POST', url: `/api/follows/${user1.user._id}`, headers: authHeader(user2.token) });
    expect(res.statusCode).toBe(201);
  });

  it('rejects self-follow', async () => {
    const user = await registerAndLogin(app);
    const res = await app.inject({ method: 'POST', url: `/api/follows/${user.user._id}`, headers: authHeader(user.token) });
    expect(res.statusCode).toBe(400);
  });

  it('unfollows a user', async () => {
    const user1 = await registerAndLogin(app);
    const user2 = await registerAndLogin(app);
    await app.inject({ method: 'POST', url: `/api/follows/${user1.user._id}`, headers: authHeader(user2.token) });
    const res = await app.inject({ method: 'DELETE', url: `/api/follows/${user1.user._id}`, headers: authHeader(user2.token) });
    expect(JSON.parse(res.body).following).toBe(false);
  });

  it('lists followers', async () => {
    const user1 = await registerAndLogin(app);
    const user2 = await registerAndLogin(app);
    await app.inject({ method: 'POST', url: `/api/follows/${user1.user._id}`, headers: authHeader(user2.token) });
    const res = await app.inject({ method: 'GET', url: `/api/follows/${user1.user._id}/followers` });
    expect(JSON.parse(res.body).data).toHaveLength(1);
  });
});
