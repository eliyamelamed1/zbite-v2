import { MultipartFile } from '@fastify/multipart';

import { saveFile } from '../../plugins/upload';
import { NotFoundError } from '../../shared/errors';
import { buildPagination } from '../../shared/utils/pagination';
import { UserDal } from './user.dal';

import type { IUser, IRecipe, PaginatedResult } from '../../shared/types';
import type { IUserActivity } from '../../models/UserActivity';

interface ProfileUpdateFields {
  bio?: string;
  avatarFile?: MultipartFile;
}

const DEFAULT_SEARCH_LIMIT = 20;
const AVATARS_FOLDER = 'avatars';

/** User business logic — no HTTP concerns, no direct DB calls. */
export const UserService = {
  /** Search users by username with pagination. */
  async searchUsers(
    query: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<IUser>> {
    const safeLimit = Math.max(1, Math.min(100, limit || DEFAULT_SEARCH_LIMIT));
    const safePage = Math.max(1, page || 1);
    const skip = (safePage - 1) * safeLimit;

    const regex = new RegExp(query, 'i');
    const { users, total } = await UserDal.searchByUsername(regex, skip, safeLimit);

    return {
      data: users,
      pagination: buildPagination(safePage, safeLimit, total),
    };
  },

  /** Get a user profile along with their recent recipes and total recipe score. */
  async getProfile(
    userId: string,
  ): Promise<{ user: IUser; recipes: IRecipe[]; totalRecipeScore: number }> {
    const [profileData, totalRecipeScore] = await Promise.all([
      UserDal.findByIdWithRecipes(userId),
      UserDal.getTotalRecipeScore(userId),
    ]);
    if (!profileData.user) throw new NotFoundError('User', userId);
    return { user: profileData.user, recipes: profileData.recipes, totalRecipeScore };
  },

  /** Update the authenticated user's profile (bio and/or avatar). */
  async updateProfile(
    userId: string,
    fields: ProfileUpdateFields,
  ): Promise<IUser> {
    const updates: Record<string, string> = {};

    if (fields.bio !== undefined) {
      updates.bio = fields.bio;
    }

    if (fields.avatarFile) {
      updates.avatar = await saveFile(fields.avatarFile, AVATARS_FOLDER);
    }

    const user = await UserDal.updateProfile(userId, updates);
    if (!user) throw new NotFoundError('User', userId);
    return user;
  },

  /** Get suggested users the current user does not follow. */
  async getSuggestedUsers(currentUserId: string): Promise<IUser[]> {
    return UserDal.getSuggestedUsers(currentUserId);
  },

  /** Get the authenticated user's activity feed (views, saves, cooks). */
  async getActivity(
    userId: string,
    action: string | undefined,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<IUserActivity>> {
    const safeLimit = Math.max(1, Math.min(100, limit || DEFAULT_SEARCH_LIMIT));
    const safePage = Math.max(1, page || 1);
    const skip = (safePage - 1) * safeLimit;

    const { data, total } = await UserDal.getActivity(userId, action, skip, safeLimit);
    return { data, pagination: buildPagination(safePage, safeLimit, total) };
  },
};
