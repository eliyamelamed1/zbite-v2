import { FastifyInstance } from 'fastify';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, authHeader } from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('Notification Deletion', () => {
  it('deletes own notification', async () => {
    const user1 = await registerAndLogin(app);
    const user2 = await registerAndLogin(app);

    // Follow user1 to generate a notification
    await app.inject({ method: 'POST', url: `/api/follows/${user1.user._id}`, headers: authHeader(user2.token) });

    const notifRes = await app.inject({ method: 'GET', url: '/api/notifications', headers: authHeader(user1.token) });
    const notificationId = JSON.parse(notifRes.body).data[0]._id;

    const deleteRes = await app.inject({ method: 'DELETE', url: `/api/notifications/${notificationId}`, headers: authHeader(user1.token) });
    expect(deleteRes.statusCode).toBe(200);
    expect(JSON.parse(deleteRes.body).deleted).toBe(true);

    // Verify it was removed
    const afterRes = await app.inject({ method: 'GET', url: '/api/notifications', headers: authHeader(user1.token) });
    expect(JSON.parse(afterRes.body).data).toHaveLength(0);
  });

  it('returns 403 when deleting someone else\'s notification', async () => {
    const user1 = await registerAndLogin(app);
    const user2 = await registerAndLogin(app);
    const user3 = await registerAndLogin(app);

    // Follow user1 to generate a notification for user1
    await app.inject({ method: 'POST', url: `/api/follows/${user1.user._id}`, headers: authHeader(user2.token) });

    const notifRes = await app.inject({ method: 'GET', url: '/api/notifications', headers: authHeader(user1.token) });
    const notificationId = JSON.parse(notifRes.body).data[0]._id;

    // user3 tries to delete user1's notification
    const deleteRes = await app.inject({ method: 'DELETE', url: `/api/notifications/${notificationId}`, headers: authHeader(user3.token) });
    expect(deleteRes.statusCode).toBe(403);
  });
});
