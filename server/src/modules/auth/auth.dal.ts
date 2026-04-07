import User from '../../models/User';
import { IUser } from '../../shared/types';

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

  /** Find a user by ID. */
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  },

  /** Create a new user. */
  async create(data: { username: string; email: string; passwordHash: string }): Promise<IUser> {
    return User.create(data);
  },

  /** Update a user's interests. */
  async updateInterests(userId: string, interests: string[]): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, { interests }, { new: true });
  },
};
