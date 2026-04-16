import { FastifyInstance } from 'fastify';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, createTestRecipe, authHeader } from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('Comment Replies', () => {
  it('creates a reply to an existing comment', async () => {
    const author = await registerAndLogin(app);
    const commenter = await registerAndLogin(app);
    const replier = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);

    const commentRes = await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(commenter.token), payload: { text: 'Original comment' } });
    const parentId = JSON.parse(commentRes.body).comment._id;

    const replyRes = await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(replier.token), payload: { text: 'This is a reply', parentCommentId: parentId } });
    expect(replyRes.statusCode).toBe(201);
    expect(JSON.parse(replyRes.body).comment.text).toBe('This is a reply');
  });

  it('increments repliesCount on parent comment', async () => {
    const author = await registerAndLogin(app);
    const commenter = await registerAndLogin(app);
    const replier = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);

    const commentRes = await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(commenter.token), payload: { text: 'Original comment' } });
    const parentId = JSON.parse(commentRes.body).comment._id;

    await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(replier.token), payload: { text: 'Reply one', parentCommentId: parentId } });
    await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(replier.token), payload: { text: 'Reply two', parentCommentId: parentId } });

    const repliesRes = await app.inject({ method: 'GET', url: `/api/comments/${recipe._id}/${parentId}/replies` });
    const body = JSON.parse(repliesRes.body);
    expect(body.data).toHaveLength(2);
  });

  it('returns paginated replies for a comment', async () => {
    const author = await registerAndLogin(app);
    const commenter = await registerAndLogin(app);
    const replier = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);

    const commentRes = await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(commenter.token), payload: { text: 'Original comment' } });
    const parentId = JSON.parse(commentRes.body).comment._id;

    await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(replier.token), payload: { text: 'Reply 1', parentCommentId: parentId } });
    await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(replier.token), payload: { text: 'Reply 2', parentCommentId: parentId } });

    const res = await app.inject({ method: 'GET', url: `/api/comments/${recipe._id}/${parentId}/replies?page=1&limit=1` });
    const body = JSON.parse(res.body);
    expect(body.data).toHaveLength(1);
    expect(body.pagination.pages).toBe(2);
  });

  it('creates notification for parent comment author', async () => {
    const author = await registerAndLogin(app);
    const commenter = await registerAndLogin(app);
    const replier = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);

    const commentRes = await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(commenter.token), payload: { text: 'Original comment' } });
    const parentId = JSON.parse(commentRes.body).comment._id;

    await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(replier.token), payload: { text: 'Replying to you', parentCommentId: parentId } });

    const notifRes = await app.inject({ method: 'GET', url: '/api/notifications', headers: authHeader(commenter.token) });
    const notifications = JSON.parse(notifRes.body).data;
    const replyNotification = notifications.find((n: { type: string }) => n.type === 'comment');
    expect(replyNotification).toBeTruthy();
  });

  it('does not create self-notification for own reply', async () => {
    const author = await registerAndLogin(app);
    const commenter = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);

    const commentRes = await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(commenter.token), payload: { text: 'My comment' } });
    const parentId = JSON.parse(commentRes.body).comment._id;

    // Reply to own comment
    await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(commenter.token), payload: { text: 'My own reply', parentCommentId: parentId } });

    const notifRes = await app.inject({ method: 'GET', url: '/api/notifications', headers: authHeader(commenter.token) });
    const notifications = JSON.parse(notifRes.body).data;
    // Commenter should not have a reply notification from themselves
    const selfReplyNotif = notifications.find((n: { type: string; sender: { _id: string } }) => n.type === 'comment' && n.sender._id === commenter.user._id);
    expect(selfReplyNotif).toBeFalsy();
  });

  it('returns 404 when replying to non-existent comment', async () => {
    const author = await registerAndLogin(app);
    const replier = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);

    const res = await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(replier.token), payload: { text: 'Reply to nothing', parentCommentId: '000000000000000000000000' } });
    expect(res.statusCode).toBe(404);
  });
});
