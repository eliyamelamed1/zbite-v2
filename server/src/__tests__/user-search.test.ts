import { FastifyInstance } from 'fastify';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin } from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('GET /api/users/search', () => {
  it('returns matching users by username', async () => {
    await registerAndLogin(app, { username: 'chef_mario' });
    await registerAndLogin(app, { username: 'chef_anna' });
    await registerAndLogin(app, { username: 'baker_bob' });

    const res = await app.inject({ method: 'GET', url: '/api/users/search?q=chef' });
    const body = JSON.parse(res.body);

    expect(body.data).toHaveLength(2);
    const names = body.data.map((u: { username: string }) => u.username);
    expect(names).toContain('chef_mario');
    expect(names).toContain('chef_anna');
  });

  it('returns empty result for no matches', async () => {
    await registerAndLogin(app, { username: 'alpha' });

    const res = await app.inject({ method: 'GET', url: '/api/users/search?q=zzz_no_match' });
    const body = JSON.parse(res.body);

    expect(body.data).toHaveLength(0);
    expect(body.pagination.total).toBe(0);
  });

  it('returns empty result when query is missing', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/users/search' });
    const body = JSON.parse(res.body);

    expect(body.data).toHaveLength(0);
  });

  it('is case-insensitive', async () => {
    await registerAndLogin(app, { username: 'ChefMario' });

    const res = await app.inject({ method: 'GET', url: '/api/users/search?q=chefmario' });
    const body = JSON.parse(res.body);

    expect(body.data).toHaveLength(1);
    expect(body.data[0].username).toBe('ChefMario');
  });

  it('returns pagination metadata', async () => {
    await registerAndLogin(app, { username: 'user_a' });
    await registerAndLogin(app, { username: 'user_b' });
    await registerAndLogin(app, { username: 'user_c' });

    const res = await app.inject({ method: 'GET', url: '/api/users/search?q=user&page=1&limit=2' });
    const body = JSON.parse(res.body);

    expect(body.data).toHaveLength(2);
    expect(body.pagination.total).toBe(3);
    expect(body.pagination.pages).toBe(2);
    expect(body.pagination.page).toBe(1);
  });

  it('respects page parameter', async () => {
    await registerAndLogin(app, { username: 'user_a' });
    await registerAndLogin(app, { username: 'user_b' });
    await registerAndLogin(app, { username: 'user_c' });

    const res = await app.inject({ method: 'GET', url: '/api/users/search?q=user&page=2&limit=2' });
    const body = JSON.parse(res.body);

    expect(body.data).toHaveLength(1);
    expect(body.pagination.page).toBe(2);
  });

  it('does not expose passwordHash', async () => {
    await registerAndLogin(app, { username: 'safeuser' });

    const res = await app.inject({ method: 'GET', url: '/api/users/search?q=safeuser' });
    const body = JSON.parse(res.body);

    expect(body.data[0]).not.toHaveProperty('passwordHash');
  });
});
