import { Types } from 'mongoose';

import User from '../../models/User';
import Recipe from '../../models/Recipe';
import Follow from '../../models/Follow';

import type { IUser, IRecipe } from '../../shared/types';

const PROFILE_RECIPES_LIMIT = 12;
const SUGGESTED_USERS_LIMIT = 5;
const SUGGESTED_USERS_FIELDS = 'username avatar bio followersCount recipesCount';
const RECIPE_AUTHOR_FIELDS = 'username avatar';

/** Data Access Layer for user-related Mongoose queries. */
export const UserDal = {
  /** Search users by username with regex matching. */
  async searchByUsername(
    regex: RegExp,
    skip: number,
    limit: number,
  ): Promise<{ users: IUser[]; total: number }> {
    const [users, total] = await Promise.all([
      User.find({ username: regex }).skip(skip).limit(limit),
      User.countDocuments({ username: regex }),
    ]);

    return { users, total };
  },

  /** Find a single user by ID. */
  async findById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  },

  /** Find a user by ID and their most recent recipes. */
  async findByIdWithRecipes(
    userId: string,
  ): Promise<{ user: IUser | null; recipes: IRecipe[] }> {
    const user = await User.findById(userId);
    if (!user) return { user: null, recipes: [] };

    const recipes = await Recipe.find({ author: user._id })
      .sort({ createdAt: -1 })
      .limit(PROFILE_RECIPES_LIMIT)
      .populate('author', RECIPE_AUTHOR_FIELDS);

    return { user, recipes };
  },

  /** Apply partial updates to a user profile. */
  async updateProfile(
    userId: string,
    updates: Record<string, string>,
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, updates, { new: true });
  },

  /** Get users not followed by the current user, sorted by popularity. */
  async getSuggestedUsers(currentUserId: string): Promise<IUser[]> {
    const follows = await Follow.find({ follower: currentUserId }).select('following');
    const excludedIds: Types.ObjectId[] = follows.map((follow) => follow.following);
    excludedIds.push(new Types.ObjectId(currentUserId));

    return User.find({ _id: { $nin: excludedIds } })
      .sort({ followersCount: -1 })
      .limit(SUGGESTED_USERS_LIMIT)
      .select(SUGGESTED_USERS_FIELDS);
  },
};
