import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AuthDal } from './auth.dal';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../shared/errors';
import { IUser } from '../../shared/types';
import { RegisterBody, LoginBody } from './auth.schemas';

/** Generates a signed JWT token for a user. */
function generateToken(user: { _id: unknown; username: string }): string {
  return jwt.sign(
    { id: String(user._id), username: user.username },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as unknown as number }
  );
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

    const isMatch = await user.comparePassword(body.password);
    if (!isMatch) throw new UnauthorizedError('Invalid email or password');

    const token = generateToken(user);
    return { token, user };
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
