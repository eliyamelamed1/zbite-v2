import { FastifyInstance } from 'fastify';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, createTestRecipe, authHeader } from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('Mentions', () => {
  it('creates mention notification when comment contains @username', async () => {
    const author = await registerAndLogin(app);
    const mentionee = await registerAndLogin(app, { username: 'mentionee' });
    const commenter = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);

    await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(commenter.token), payload: { text: 'Hey @mentionee check this out!' } });

    const notifRes = await app.inject({ method: 'GET', url: '/api/notifications', headers: authHeader(mentionee.token) });
    const notifications = JSON.parse(notifRes.body).data;
    const mentionNotif = notifications.find((n: { type: string }) => n.type === 'mention');
    expect(mentionNotif).toBeTruthy();
  });

  it('skips non-existent usernames', async () => {
    const author = await registerAndLogin(app);
    const commenter = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);

    const res = await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(commenter.token), payload: { text: 'Hey @nonexistentuser123 how are you?' } });
    // Should succeed without error even though username does not exist
    expect(res.statusCode).toBe(201);
  });

  it('skips self-mention', async () => {
    const author = await registerAndLogin(app);
    const commenter = await registerAndLogin(app, { username: 'selfmention' });
    const { recipe } = await createTestRecipe(app, author.token);

    await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(commenter.token), payload: { text: 'I am @selfmention talking about myself' } });

    const notifRes = await app.inject({ method: 'GET', url: '/api/notifications', headers: authHeader(commenter.token) });
    const notifications = JSON.parse(notifRes.body).data;
    const mentionNotif = notifications.find((n: { type: string }) => n.type === 'mention');
    expect(mentionNotif).toBeFalsy();
  });

  it('handles multiple @mentions in one comment', async () => {
    const author = await registerAndLogin(app);
    const userA = await registerAndLogin(app, { username: 'alice' });
    const userB = await registerAndLogin(app, { username: 'bob' });
    const commenter = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);

    await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(commenter.token), payload: { text: 'Hey @alice and @bob look at this!' } });

    const aliceNotifs = await app.inject({ method: 'GET', url: '/api/notifications', headers: authHeader(userA.token) });
    const bobNotifs = await app.inject({ method: 'GET', url: '/api/notifications', headers: authHeader(userB.token) });

    const aliceMention = JSON.parse(aliceNotifs.body).data.find((n: { type: string }) => n.type === 'mention');
    const bobMention = JSON.parse(bobNotifs.body).data.find((n: { type: string }) => n.type === 'mention');
    expect(aliceMention).toBeTruthy();
    expect(bobMention).toBeTruthy();
  });

  it('deduplicates repeated @mentions', async () => {
    const author = await registerAndLogin(app);
    const mentionee = await registerAndLogin(app, { username: 'dupeuser' });
    const commenter = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);

    await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(commenter.token), payload: { text: '@dupeuser @dupeuser @dupeuser please look' } });

    const notifRes = await app.inject({ method: 'GET', url: '/api/notifications', headers: authHeader(mentionee.token) });
    const mentionNotifs = JSON.parse(notifRes.body).data.filter((n: { type: string }) => n.type === 'mention');
    expect(mentionNotifs).toHaveLength(1);
  });
});
