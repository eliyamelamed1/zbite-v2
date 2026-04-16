import { FastifyInstance } from 'fastify';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, createTestRecipe, authHeader } from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('Comment Deletion', () => {
  it('deletes own comment', async () => {
    const author = await registerAndLogin(app);
    const commenter = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);

    const commentRes = await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(commenter.token), payload: { text: 'To be deleted' } });
    const commentId = JSON.parse(commentRes.body).comment._id;

    const deleteRes = await app.inject({ method: 'DELETE', url: `/api/comments/${commentId}`, headers: authHeader(commenter.token) });
    expect(deleteRes.statusCode).toBe(200);
    expect(JSON.parse(deleteRes.body).deleted).toBe(true);
  });

  it('returns 403 when deleting someone else\'s comment', async () => {
    const author = await registerAndLogin(app);
    const commenter = await registerAndLogin(app);
    const otherUser = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);

    const commentRes = await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(commenter.token), payload: { text: 'Not yours' } });
    const commentId = JSON.parse(commentRes.body).comment._id;

    const deleteRes = await app.inject({ method: 'DELETE', url: `/api/comments/${commentId}`, headers: authHeader(otherUser.token) });
    expect(deleteRes.statusCode).toBe(403);
  });

  it('decrements commentsCount on recipe after deletion', async () => {
    const author = await registerAndLogin(app);
    const commenter = await registerAndLogin(app);
    const { recipe } = await createTestRecipe(app, author.token);

    const commentRes = await app.inject({ method: 'POST', url: `/api/comments/${recipe._id}`, headers: authHeader(commenter.token), payload: { text: 'Will be deleted' } });
    const commentId = JSON.parse(commentRes.body).comment._id;

    // Verify commentsCount incremented
    const beforeRes = await app.inject({ method: 'GET', url: `/api/recipes/${recipe._id}` });
    const beforeCount = JSON.parse(beforeRes.body).recipe.commentsCount;

    await app.inject({ method: 'DELETE', url: `/api/comments/${commentId}`, headers: authHeader(commenter.token) });

    const afterRes = await app.inject({ method: 'GET', url: `/api/recipes/${recipe._id}` });
    const afterCount = JSON.parse(afterRes.body).recipe.commentsCount;
    expect(afterCount).toBe(beforeCount - 1);
  });

  it('returns 404 for non-existent comment', async () => {
    const { token } = await registerAndLogin(app);
    const res = await app.inject({ method: 'DELETE', url: '/api/comments/000000000000000000000000', headers: authHeader(token) });
    expect(res.statusCode).toBe(404);
  });
});
