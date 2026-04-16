import { FastifyInstance } from 'fastify';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, createTestRecipe, authHeader } from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('Full Happy Flow', () => {
  it('simulates two users interacting end-to-end', async () => {
    // ─── 1. USER A registers ───
    const userA = await registerAndLogin(app, { username: 'chefanna', email: 'anna@test.com' });
    expect(userA.response.statusCode).toBe(201);

    // ─── 2. USER A saves interests ───
    const intA = await app.inject({ method: 'PUT', url: '/api/auth/interests', headers: authHeader(userA.token), payload: { interests: ['Italian', 'Asian', 'Baking'] } });
    expect(JSON.parse(intA.body).user.interests).toEqual(['Italian', 'Asian', 'Baking']);

    // ─── 3. USER A creates "Pasta Carbonara" ───
    const { recipe: carbonara } = await createTestRecipe(app, userA.token, { title: 'Pasta Carbonara', tags: ['Italian'] });
    expect(carbonara.title).toBe('Pasta Carbonara');
    expect(carbonara.author.username).toBe('chefanna');

    // ─── 4. USER A creates "Tiramisu" ───
    const { recipe: tiramisu } = await createTestRecipe(app, userA.token, { title: 'Tiramisu', tags: ['Dessert'] });
    const meA1 = await app.inject({ method: 'GET', url: '/api/auth/me', headers: authHeader(userA.token) });
    expect(JSON.parse(meA1.body).user.recipesCount).toBe(2);

    // ─── 5. USER B registers ───
    const userB = await registerAndLogin(app, { username: 'chefbob', email: 'bob@test.com' });
    expect(userB.response.statusCode).toBe(201);

    // ─── 6. USER B saves interests ───
    await app.inject({ method: 'PUT', url: '/api/auth/interests', headers: authHeader(userB.token), payload: { interests: ['Vegan', 'Quick Meals'] } });

    // ─── 7. Explore feed ───
    const explore = await app.inject({ method: 'GET', url: '/api/recipes/explore' });
    const exploreData = JSON.parse(explore.body);
    expect(exploreData.data).toHaveLength(2);
    expect(exploreData.pagination.total).toBe(2);

    // ─── 8. Filter by Italian ───
    const exploreItalian = await app.inject({ method: 'GET', url: '/api/recipes/explore?tag=Italian' });
    expect(JSON.parse(exploreItalian.body).data).toHaveLength(1);
    expect(JSON.parse(exploreItalian.body).data[0].title).toBe('Pasta Carbonara');

    // ─── 9. View Carbonara detail ───
    const detail = await app.inject({ method: 'GET', url: `/api/recipes/${carbonara._id}` });
    const detailRecipe = JSON.parse(detail.body).recipe;
    expect(detailRecipe.ingredients).toHaveLength(2);
    expect(detailRecipe.author.username).toBe('chefanna');

    // ─── 10. USER B comments ───
    const comment = await app.inject({ method: 'POST', url: `/api/comments/${carbonara._id}`, headers: authHeader(userB.token), payload: { text: 'Amazing recipe!' } });
    expect(comment.statusCode).toBe(201);
    expect(JSON.parse(comment.body).comment.user.username).toBe('chefbob');

    // ─── 11. USER B saves Carbonara ───
    const save = await app.inject({ method: 'POST', url: `/api/saved/${carbonara._id}`, headers: authHeader(userB.token) });
    expect(save.statusCode).toBe(201);

    // ─── 12. USER B follows USER A ───
    const follow = await app.inject({ method: 'POST', url: `/api/follows/${userA.user._id}`, headers: authHeader(userB.token) });
    expect(follow.statusCode).toBe(201);
    const profileA = await app.inject({ method: 'GET', url: `/api/users/${userA.user._id}` });
    expect(JSON.parse(profileA.body).user.followersCount).toBe(1);

    // ─── 13. Following feed ───
    const followingFeed = await app.inject({ method: 'GET', url: '/api/recipes/following', headers: authHeader(userB.token) });
    expect(JSON.parse(followingFeed.body).data).toHaveLength(2);

    // ─── 14. Saved recipes ───
    const savedList = await app.inject({ method: 'GET', url: '/api/saved', headers: authHeader(userB.token) });
    expect(JSON.parse(savedList.body).data).toHaveLength(1);

    // ─── 15. Filter saved by Italian ───
    const savedItalian = await app.inject({ method: 'GET', url: '/api/saved?tag=Italian', headers: authHeader(userB.token) });
    expect(JSON.parse(savedItalian.body).data).toHaveLength(1);

    // ─── 16. USER A checks notifications (3: comment, save, follow) ───
    const notifs = await app.inject({ method: 'GET', url: '/api/notifications', headers: authHeader(userA.token) });
    const notifsData = JSON.parse(notifs.body).data;
    expect(notifsData).toHaveLength(3);
    const types = notifsData.map((n: { type: string }) => n.type).sort();
    expect(types).toEqual(['comment', 'follow', 'save']);

    // ─── 17. Unread count ───
    const unread = await app.inject({ method: 'GET', url: '/api/notifications/unread-count', headers: authHeader(userA.token) });
    expect(JSON.parse(unread.body).count).toBe(3);

    // ─── 18. Mark all read ───
    await app.inject({ method: 'PUT', url: '/api/notifications/read', headers: authHeader(userA.token), payload: {} });
    const unreadAfter = await app.inject({ method: 'GET', url: '/api/notifications/unread-count', headers: authHeader(userA.token) });
    expect(JSON.parse(unreadAfter.body).count).toBe(0);

    // ─── 19. Leaderboard ───
    const lb = await app.inject({ method: 'GET', url: '/api/leaderboard' });
    const lbData = JSON.parse(lb.body).data;
    expect(lbData.length).toBeGreaterThanOrEqual(1);
    expect(lbData[0].user.username).toBe('chefanna');

    // ─── 20. USER B views USER A's profile ───
    const profileA2 = await app.inject({ method: 'GET', url: `/api/users/${userA.user._id}` });
    expect(JSON.parse(profileA2.body).user.recipesCount).toBe(2);

    // ─── 21-22. Undo: unsave, unfollow ───
    await app.inject({ method: 'DELETE', url: `/api/saved/${carbonara._id}`, headers: authHeader(userB.token) });
    await app.inject({ method: 'DELETE', url: `/api/follows/${userA.user._id}`, headers: authHeader(userB.token) });

    // ─── 23. Following feed now empty ───
    const emptyFeed = await app.inject({ method: 'GET', url: '/api/recipes/following', headers: authHeader(userB.token) });
    expect(JSON.parse(emptyFeed.body).data).toHaveLength(0);

    // ─── 24. Delete Tiramisu ───
    await app.inject({ method: 'DELETE', url: `/api/recipes/${tiramisu._id}`, headers: authHeader(userA.token) });
    const meA2 = await app.inject({ method: 'GET', url: '/api/auth/me', headers: authHeader(userA.token) });
    expect(JSON.parse(meA2.body).user.recipesCount).toBe(1);

    // ─── 25. Final state ───
    const finalExplore = await app.inject({ method: 'GET', url: '/api/recipes/explore' });
    expect(JSON.parse(finalExplore.body).data).toHaveLength(1);
    expect(JSON.parse(finalExplore.body).data[0].title).toBe('Pasta Carbonara');

    const finalLb = await app.inject({ method: 'GET', url: '/api/leaderboard' });
    expect(JSON.parse(finalLb.body).data).toHaveLength(1);
  });
});
