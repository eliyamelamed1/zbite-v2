import { FastifyInstance } from 'fastify';
import { setupTestEnvironment, teardownTestEnvironment, cleanDatabase, registerAndLogin, authHeader } from './setup';

let app: FastifyInstance;

beforeAll(async () => { app = await setupTestEnvironment(); });
afterAll(async () => { await teardownTestEnvironment(); });
beforeEach(async () => { await cleanDatabase(); });

describe('POST /api/auth/register', () => {
  it('registers a new user', async () => {
    const { response, token, user } = await registerAndLogin(app, { username: 'chef1', email: 'chef1@test.com' });
    expect(response.statusCode).toBe(201);
    expect(token).toBeTruthy();
    expect(user._id).toBeTruthy();
    expect(user.username).toBe('chef1');
    expect(user.email).toBe('chef1@test.com');
    expect(user.passwordHash).toBeUndefined();
  });

  it('returns isNewUser flag', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { username: 'newuser', email: 'new@test.com', password: 'pass123' } });
    expect(JSON.parse(res.body).isNewUser).toBe(true);
  });

  it('rejects duplicate email', async () => {
    await registerAndLogin(app, { username: 'dupuser1', email: 'dup@test.com' });
    const res = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { username: 'dupuser2', email: 'dup@test.com', password: 'pass123' } });
    expect(res.statusCode).toBe(409);
  });

  it('rejects duplicate username', async () => {
    await registerAndLogin(app, { username: 'samename', email: 'a@test.com' });
    const res = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { username: 'samename', email: 'b@test.com', password: 'pass123' } });
    expect(res.statusCode).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    await registerAndLogin(app, { username: 'loginuser', email: 'login@test.com', password: 'mypass' });
    const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'login@test.com', password: 'mypass' } });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).token).toBeTruthy();
  });

  it('rejects wrong password', async () => {
    await registerAndLogin(app, { email: 'wp@test.com', password: 'correct' });
    const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'wp@test.com', password: 'wrong' } });
    expect(res.statusCode).toBe(401);
  });

  it('rejects non-existent email', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'nope@test.com', password: 'any' } });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns user with valid token', async () => {
    const { token } = await registerAndLogin(app, { username: 'meuser' });
    const res = await app.inject({ method: 'GET', url: '/api/auth/me', headers: authHeader(token) });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).user.username).toBe('meuser');
  });

  it('rejects without token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(res.statusCode).toBe(401);
  });
});

describe('PUT /api/auth/interests', () => {
  it('saves user interests', async () => {
    const { token } = await registerAndLogin(app);
    const res = await app.inject({ method: 'PUT', url: '/api/auth/interests', headers: authHeader(token), payload: { interests: ['Italian', 'Asian', 'Baking'] } });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).user.interests).toEqual(['Italian', 'Asian', 'Baking']);
  });
});
