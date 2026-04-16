import jwt from 'jsonwebtoken';

import { env } from '../../config/env';
import { AuthDal } from './auth.dal';
import { verifyGoogleToken, deriveBaseUsername } from './auth.utils';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../shared/errors';
import { IUser } from '../../shared/types';
import { RegisterBody, LoginBody } from './auth.schemas';

const MAX_USERNAME_ATTEMPTS = 10;
const RANDOM_SUFFIX_BOUND = 10_000;
const USERNAME_MAX_LENGTH = 30;

/** Generates a signed JWT token for a user. */
function generateToken(user: { _id: unknown; username: string; isAdmin?: boolean }): string {
  return jwt.sign(
    { id: String(user._id), username: user.username, isAdmin: user.isAdmin ?? false },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as unknown as number },
  );
}

/** Generates a unique username from a Google profile name or email. */
async function generateUniqueUsername(options: { name: string; email: string }): Promise<string> {
  const base = deriveBaseUsername(options);

  for (let i = 0; i < MAX_USERNAME_ATTEMPTS; i++) {
    const suffix = Math.floor(Math.random() * RANDOM_SUFFIX_BOUND);
    const candidate = `${base}${suffix}`;
    const existing = await AuthDal.findByEmailOrUsername('', candidate);
    if (!existing) return candidate;
  }

  // Fallback: timestamp-based suffix
  return `${base}${Date.now()}`.slice(0, USERNAME_MAX_LENGTH);
}

/** Auth business logic — no HTTP concerns, no direct DB calls. */
export const AuthService = {
  /** Register a new user. Throws ConflictError if email/username taken. */
  async register(body: RegisterBody): Promise<{ token: string; user: IUser; isNewUser: boolean }> {
    const existing = await AuthDal.findByEmailOrUsername(body.email, body.username);
    if (existing) {
      const field = existing.email === body.email ? 'Email' : 'Username';
      throw new ConflictError('User', `${field} already in use`);
    }

    const user = await AuthDal.create({
      username: body.username,
      email: body.email,
      passwordHash: body.password,
    });
    const token = generateToken(user);

    return { token, user, isNewUser: true };
  },

  /** Login an existing user. Throws UnauthorizedError on bad credentials. */
  async login(body: LoginBody): Promise<{ token: string; user: IUser }> {
    const user = await AuthDal.findByEmailWithPassword(body.email);
    if (!user) throw new UnauthorizedError('Invalid email or password');
    if (!user.passwordHash) throw new UnauthorizedError('This account uses Google sign-in');

    const isMatch = await user.comparePassword(body.password);
    if (!isMatch) throw new UnauthorizedError('Invalid email or password');

    const token = generateToken(user);
    return { token, user };
  },

  /** Authenticate via Google OAuth. Creates or links the account automatically. */
  async googleLogin(credential: string): Promise<{ token: string; user: IUser; isNewUser: boolean }> {
    const googleUser = await verifyGoogleToken(credential);

    // Returning Google user (fastest path)
    const existingByGoogleId = await AuthDal.findByGoogleId(googleUser.googleId);
    if (existingByGoogleId) {
      const token = generateToken(existingByGoogleId);
      return { token, user: existingByGoogleId, isNewUser: false };
    }

    // Existing user with same email — link Google account
    const existingByEmail = await AuthDal.findByEmail(googleUser.email);
    if (existingByEmail) {
      await AuthDal.linkGoogleId(String(existingByEmail._id), googleUser.googleId);
      const token = generateToken(existingByEmail);
      return { token, user: existingByEmail, isNewUser: false };
    }

    // New user — auto-generate username from Google profile
    const username = await generateUniqueUsername({
      name: googleUser.name,
      email: googleUser.email,
    });

    const user = await AuthDal.create({
      username,
      email: googleUser.email,
      googleId: googleUser.googleId,
      avatar: googleUser.picture,
    });
    const token = generateToken(user);

    return { token, user, isNewUser: true };
  },

  /** Get the currently authenticated user by ID. */
  async getMe(userId: string): Promise<IUser> {
    const user = await AuthDal.findById(userId);
    if (!user) throw new NotFoundError('User', userId);
    return user;
  },

  /** Save user interest categories. */
  async saveInterests(userId: string, interests: string[]): Promise<IUser> {
    const user = await AuthDal.updateInterests(userId, interests);
    if (!user) throw new NotFoundError('User', userId);
    return user;
  },
};
