import User from '../../models/User';
import { IUser } from '../../shared/types';

/** Options for creating a new user. Password is optional for OAuth users. */
interface CreateUserData {
  username: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  avatar?: string;
}

/** Data Access Layer for auth-related User queries. */
export const AuthDal = {
  /** Find a user by email or username. */
  async findByEmailOrUsername(email: string, username: string): Promise<IUser | null> {
    return User.findOne({ $or: [{ email }, { username }] });
  },

  /** Find a user by email, including the passwordHash field. */
  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return User.findOne({ email }).select('+passwordHash');
  },

  /** Find a user by email (without passwordHash). */
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  },

  /** Find a user by Google ID. */
  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return User.findOne({ googleId });
  },

  /** Find a user by ID. */
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  },

  /** Create a new user. */
  async create(data: CreateUserData): Promise<IUser> {
    return User.create(data);
  },

  /** Link a Google account to an existing user. */
  async linkGoogleId(userId: string, googleId: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, { googleId }, { new: true });
  },

  /** Update a user's interests. */
  async updateInterests(userId: string, interests: string[]): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, { interests }, { new: true });
  },
};
