import { FastifyInstance } from 'fastify';
import { vi } from 'vitest';

import {
  setupTestEnvironment,
  teardownTestEnvironment,
  cleanDatabase,
  registerAndLogin,
  authHeader,
} from './setup';
import User from '../models/User';

// Mock only verifyGoogleToken — keep deriveBaseUsername as the real implementation
vi.mock('../modules/auth/auth.utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../modules/auth/auth.utils')>();
  return {
    ...actual,
    verifyGoogleToken: vi.fn(),
  };
});

import { verifyGoogleToken, deriveBaseUsername } from '../modules/auth/auth.utils';

const mockVerifyGoogleToken = vi.mocked(verifyGoogleToken);

let app: FastifyInstance;

beforeAll(async () => {
  app = await setupTestEnvironment();
});
afterAll(async () => {
  await teardownTestEnvironment();
});
beforeEach(async () => {
  await cleanDatabase();
  mockVerifyGoogleToken.mockReset();
});

const MOCK_GOOGLE_USER = {
  googleId: 'google-abc-123',
  email: 'googleuser@gmail.com',
  name: 'Chef Mario',
  picture: 'https://lh3.googleusercontent.com/photo.jpg',
};

// ---------------------------------------------------------------------------
// POST /api/auth/google — new user
// ---------------------------------------------------------------------------
describe('POST /api/auth/google — new user', () => {
  it('creates a new user and returns 201 with isNewUser true', async () => {
    mockVerifyGoogleToken.mockResolvedValueOnce(MOCK_GOOGLE_USER);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/google',
      payload: { credential: 'valid-google-id-token' },
    });

    const body = JSON.parse(res.body);
    expect(res.statusCode).toBe(201);
    expect(body.token).toBeTruthy();
    expect(body.isNewUser).toBe(true);
    expect(body.user.email).toBe(MOCK_GOOGLE_USER.email);
    expect(body.user.passwordHash).toBeUndefined();
  });

  it('sets avatar from Google profile picture', async () => {
    mockVerifyGoogleToken.mockResolvedValueOnce(MOCK_GOOGLE_USER);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/google',
      payload: { credential: 'token' },
    });

    const body = JSON.parse(res.body);
    expect(body.user.avatar).toBe(MOCK_GOOGLE_USER.picture);
  });

  it('generates a username derived from Google name', async () => {
    mockVerifyGoogleToken.mockResolvedValueOnce(MOCK_GOOGLE_USER);

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/google',
      payload: { credential: 'token' },
    });

    const body = JSON.parse(res.body);
    // Username should start with the sanitized name base ("chefmario")
    expect(body.user.username).toMatch(/^chefmario\d+$/);
  });

  it('falls back to email prefix when Google name is empty', async () => {
    mockVerifyGoogleToken.mockResolvedValueOnce({
      ...MOCK_GOOGLE_USER,
      name: '',
      email: 'coolchef99@gmail.com',
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/google',
      payload: { credential: 'token' },
    });

    const body = JSON.parse(res.body);
    expect(body.user.username).toMatch(/^coolchef\d+$/);
  });

  it('issued token grants access to protected routes', async () => {
    mockVerifyGoogleToken.mockResolvedValueOnce(MOCK_GOOGLE_USER);

    const googleRes = await app.inject({
      method: 'POST',
      url: '/api/auth/google',
      payload: { credential: 'token' },
    });
    const { token } = JSON.parse(googleRes.body);

    const meRes = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: authHeader(token),
    });

    expect(meRes.statusCode).toBe(200);
    expect(JSON.parse(meRes.body).user.email).toBe(MOCK_GOOGLE_USER.email);
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/google — returning user
// ---------------------------------------------------------------------------
describe('POST /api/auth/google — returning user', () => {
  it('returns 200 with isNewUser false for known Google ID', async () => {
    // First login — creates the user
    mockVerifyGoogleToken.mockResolvedValueOnce(MOCK_GOOGLE_USER);
    await app.inject({
      method: 'POST',
      url: '/api/auth/google',
      payload: { credential: 'first-token' },
    });

    // Second login — same Google ID
    mockVerifyGoogleToken.mockResolvedValueOnce(MOCK_GOOGLE_USER);
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/google',
      payload: { credential: 'second-token' },
    });

    const body = JSON.parse(res.body);
    expect(res.statusCode).toBe(200);
    expect(body.isNewUser).toBe(false);
    expect(body.token).toBeTruthy();
    expect(body.user.email).toBe(MOCK_GOOGLE_USER.email);
  });

  it('does not create duplicate users on repeated Google logins', async () => {
    mockVerifyGoogleToken.mockResolvedValue(MOCK_GOOGLE_USER);

    await app.inject({ method: 'POST', url: '/api/auth/google', payload: { credential: 't1' } });
    await app.inject({ method: 'POST', url: '/api/auth/google', payload: { credential: 't2' } });
    await app.inject({ method: 'POST', url: '/api/auth/google', payload: { credential: 't3' } });

    const userCount = await User.countDocuments({ email: MOCK_GOOGLE_USER.email });
    expect(userCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/google — account linking
// ---------------------------------------------------------------------------
describe('POST /api/auth/google — account linking', () => {
  it('links Google account to existing email/password user', async () => {
    // Register with email/password first
    await registerAndLogin(app, {
      username: 'existingchef',
      email: 'shared@test.com',
      password: 'pass123',
    });

    // Google login with same email
    mockVerifyGoogleToken.mockResolvedValueOnce({
      ...MOCK_GOOGLE_USER,
      email: 'shared@test.com',
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/google',
      payload: { credential: 'link-token' },
    });

    const body = JSON.parse(res.body);
    expect(res.statusCode).toBe(200);
    expect(body.isNewUser).toBe(false);
    expect(body.user.username).toBe('existingchef');
  });

  it('persists the googleId in the database after linking', async () => {
    await registerAndLogin(app, {
      username: 'linkuser',
      email: 'link@test.com',
      password: 'pass123',
    });

    mockVerifyGoogleToken.mockResolvedValueOnce({
      ...MOCK_GOOGLE_USER,
      email: 'link@test.com',
    });

    await app.inject({
      method: 'POST',
      url: '/api/auth/google',
      payload: { credential: 'link-token' },
    });

    const dbUser = await User.findOne({ email: 'link@test.com' });
    expect(dbUser?.googleId).toBe(MOCK_GOOGLE_USER.googleId);
  });

  it('allows password login after linking Google account', async () => {
    await registerAndLogin(app, {
      username: 'dualuser',
      email: 'dual@test.com',
      password: 'mypassword',
    });

    // Link Google
    mockVerifyGoogleToken.mockResolvedValueOnce({
      ...MOCK_GOOGLE_USER,
      email: 'dual@test.com',
    });
    await app.inject({
      method: 'POST',
      url: '/api/auth/google',
      payload: { credential: 'link-token' },
    });

    // Password login should still work
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'dual@test.com', password: 'mypassword' },
    });

    expect(loginRes.statusCode).toBe(200);
    expect(JSON.parse(loginRes.body).token).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/login — Google-only user guard
// ---------------------------------------------------------------------------
describe('POST /api/auth/login — Google-only users', () => {
  it('rejects password login for Google-only user with 401', async () => {
    // Create a Google-only user
    mockVerifyGoogleToken.mockResolvedValueOnce(MOCK_GOOGLE_USER);
    await app.inject({
      method: 'POST',
      url: '/api/auth/google',
      payload: { credential: 'token' },
    });

    // Attempt password login with the same email
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: MOCK_GOOGLE_USER.email, password: 'anypassword' },
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error.message).toContain('Google sign-in');
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/google — error handling
// ---------------------------------------------------------------------------
describe('POST /api/auth/google — error handling', () => {
  it('returns 500 when Google token verification fails', async () => {
    mockVerifyGoogleToken.mockRejectedValueOnce(new Error('Invalid Google credential'));

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/google',
      payload: { credential: 'bad-token' },
    });

    expect(res.statusCode).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/auth/interests — OAuth onboarding flow
// ---------------------------------------------------------------------------
describe('PUT /api/auth/interests — OAuth onboarding', () => {
  it('allows a new Google user to save interests after signup', async () => {
    mockVerifyGoogleToken.mockResolvedValueOnce(MOCK_GOOGLE_USER);

    const googleRes = await app.inject({
      method: 'POST',
      url: '/api/auth/google',
      payload: { credential: 'token' },
    });
    const { token } = JSON.parse(googleRes.body);

    const res = await app.inject({
      method: 'PUT',
      url: '/api/auth/interests',
      headers: authHeader(token),
      payload: { interests: ['Italian', 'Asian', 'Baking'] },
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).user.interests).toEqual(['Italian', 'Asian', 'Baking']);
  });
});

// ---------------------------------------------------------------------------
// deriveBaseUsername — pure unit tests
// ---------------------------------------------------------------------------
describe('deriveBaseUsername', () => {
  it('derives from name when provided', () => {
    const result = deriveBaseUsername({ name: 'Chef Mario', email: 'mario@test.com' });
    expect(result).toBe('chefmario');
  });

  it('falls back to email prefix when name is empty', () => {
    const result = deriveBaseUsername({ name: '', email: 'coolchef99@gmail.com' });
    expect(result).toBe('coolchef99');
  });

  it('strips non-alphanumeric characters', () => {
    const result = deriveBaseUsername({ name: 'J@hn D.o.e!', email: 'j@test.com' });
    expect(result).toBe('jhndoe');
  });

  it('lowercases the result', () => {
    const result = deriveBaseUsername({ name: 'JohnDoe', email: 'j@test.com' });
    expect(result).toBe('johndoe');
  });

  it('pads short inputs to minimum 3 characters', () => {
    const result = deriveBaseUsername({ name: 'AB', email: 'ab@test.com' });
    expect(result).toBe('abx');
  });

  it('pads single-char input correctly', () => {
    const result = deriveBaseUsername({ name: 'A', email: 'a@test.com' });
    expect(result).toBe('axx');
  });

  it('truncates long inputs to 26 characters', () => {
    const longName = 'a'.repeat(40);
    const result = deriveBaseUsername({ name: longName, email: 'long@test.com' });
    expect(result).toHaveLength(26);
  });

  it('handles name that is all special characters', () => {
    const result = deriveBaseUsername({ name: '!!!', email: 'special@test.com' });
    // All chars stripped → empty → falls below min length → padded
    expect(result).toBe('xxx');
  });

  it('uses email prefix when name has no valid alphanumeric chars', () => {
    const result = deriveBaseUsername({ name: '', email: 'user.name+tag@test.com' });
    expect(result).toBe('usernametag');
  });
});
