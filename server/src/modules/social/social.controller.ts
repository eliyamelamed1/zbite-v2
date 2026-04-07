import { FastifyRequest, FastifyReply } from 'fastify';

import { SocialService } from './social.service';
import { parsePaginationQuery } from '../../shared/utils/pagination';
import {
  RecipeIdParamsSchema,
  UserIdParamsSchema,
  CreateCommentBodySchema,
  RatingBodySchema,
  BulkStatusBodySchema,
  NotificationReadBodySchema,
  SavedRecipesQuerySchema,
} from './social.schemas';

const DEFAULT_COMMENTS_LIMIT = 20;
const DEFAULT_FOLLOWS_LIMIT = 20;
const DEFAULT_SAVED_LIMIT = 12;
const DEFAULT_NOTIFICATIONS_LIMIT = 30;

// ---------------------------------------------------------------------------
// Controller — parses requests, calls service, shapes responses.
// Never contains business logic or direct DB access.
// Uses Zod .parse() on request data, matching the recipe controller pattern.
// ---------------------------------------------------------------------------

/** Social controller — handles HTTP requests for all social features. */
export const SocialController = {
  // ---- Likes ----

  /** POST /:recipeId — like a recipe. */
  async likeRecipe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { recipeId } = RecipeIdParamsSchema.parse(request.params);
    // authUser set by authenticate preHandler — safe to assert
    const result = await SocialService.likeRecipe(request.authUser!.id, recipeId);
    return reply.status(201).send(result);
  },

  /** DELETE /:recipeId — unlike a recipe. */
  async unlikeRecipe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { recipeId } = RecipeIdParamsSchema.parse(request.params);
    const result = await SocialService.unlikeRecipe(request.authUser!.id, recipeId);
    return reply.send(result);
  },

  /** GET /:recipeId/status — check like status. */
  async getLikeStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { recipeId } = RecipeIdParamsSchema.parse(request.params);
    const result = await SocialService.getLikeStatus(request.authUser!.id, recipeId);
    return reply.send(result);
  },

  /** POST /bulk-status — check like status for multiple recipes. */
  async getBulkLikeStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { recipeIds } = BulkStatusBodySchema.parse(request.body);
    const result = await SocialService.getBulkLikeStatus(request.authUser!.id, recipeIds);
    return reply.send(result);
  },

  // ---- Comments ----

  /** GET /:recipeId — get comments for a recipe. */
  async getComments(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { recipeId } = RecipeIdParamsSchema.parse(request.params);
    const { page, limit, skip } = parsePaginationQuery(
      request.query as { page?: string; limit?: string },
      DEFAULT_COMMENTS_LIMIT,
    );
    const result = await SocialService.getComments(recipeId, page, limit, skip);
    return reply.send(result);
  },

  /** POST /:recipeId — create a comment on a recipe. */
  async createComment(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { recipeId } = request.params as { recipeId: string };
    const { text } = request.body as { text: string };
    const result = await SocialService.createComment(request.authUser!.id, recipeId, text);
    return reply.status(201).send(result);
  },

  // ---- Follows ----

  /** POST /:userId — follow a user. */
  async followUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { userId } = UserIdParamsSchema.parse(request.params);
    const result = await SocialService.followUser(request.authUser!.id, userId);
    return reply.status(201).send(result);
  },

  /** DELETE /:userId — unfollow a user. */
  async unfollowUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { userId } = UserIdParamsSchema.parse(request.params);
    const result = await SocialService.unfollowUser(request.authUser!.id, userId);
    return reply.send(result);
  },

  /** GET /:userId/followers — get followers of a user. */
  async getFollowers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { userId } = UserIdParamsSchema.parse(request.params);
    const { page, limit, skip } = parsePaginationQuery(
      request.query as { page?: string; limit?: string },
      DEFAULT_FOLLOWS_LIMIT,
    );
    const result = await SocialService.getFollowers(userId, page, limit, skip);
    return reply.send(result);
  },

  /** GET /:userId/following — get users that a user is following. */
  async getFollowing(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { userId } = UserIdParamsSchema.parse(request.params);
    const { page, limit, skip } = parsePaginationQuery(
      request.query as { page?: string; limit?: string },
      DEFAULT_FOLLOWS_LIMIT,
    );
    const result = await SocialService.getFollowing(userId, page, limit, skip);
    return reply.send(result);
  },

  /** GET /:userId/status — check follow status. */
  async getFollowStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { userId } = UserIdParamsSchema.parse(request.params);
    const result = await SocialService.getFollowStatus(request.authUser!.id, userId);
    return reply.send(result);
  },

  // ---- Saved Recipes ----

  /** GET / — get saved recipes for the current user. */
  async getSavedRecipes(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = SavedRecipesQuerySchema.parse(request.query);
    const { page, limit, skip } = parsePaginationQuery(query, DEFAULT_SAVED_LIMIT);
    const result = await SocialService.getSavedRecipes(
      request.authUser!.id,
      page,
      limit,
      skip,
      query.category,
    );
    return reply.send(result);
  },

  /** POST /bulk-status — bulk-check save status. */
  async getBulkSaveStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { recipeIds } = BulkStatusBodySchema.parse(request.body);
    const result = await SocialService.getBulkSaveStatus(request.authUser!.id, recipeIds);
    return reply.send(result);
  },

  /** POST /:recipeId — save a recipe. */
  async saveRecipe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { recipeId } = RecipeIdParamsSchema.parse(request.params);
    const result = await SocialService.saveRecipe(request.authUser!.id, recipeId);
    return reply.status(201).send(result);
  },

  /** DELETE /:recipeId — unsave a recipe. */
  async unsaveRecipe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { recipeId } = RecipeIdParamsSchema.parse(request.params);
    const result = await SocialService.unsaveRecipe(request.authUser!.id, recipeId);
    return reply.send(result);
  },

  /** GET /:recipeId/status — check save status. */
  async getSaveStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { recipeId } = RecipeIdParamsSchema.parse(request.params);
    const result = await SocialService.getSaveStatus(request.authUser!.id, recipeId);
    return reply.send(result);
  },

  // ---- Ratings ----

  /** POST /:recipeId — rate a recipe (1-5 stars, upserts). */
  async rateRecipe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { recipeId } = request.params as { recipeId: string };
    const { stars } = request.body as { stars: number };
    const result = await SocialService.rateRecipe(request.authUser!.id, recipeId, stars);
    return reply.send(result);
  },

  /** GET /:recipeId/me — get the current user's rating for a recipe. */
  async getMyRating(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { recipeId } = RecipeIdParamsSchema.parse(request.params);
    const result = await SocialService.getMyRating(request.authUser!.id, recipeId);
    return reply.send(result);
  },

  // ---- Notifications ----

  /** GET / — get paginated notifications for the current user. */
  async getNotifications(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { page, limit, skip } = parsePaginationQuery(
      request.query as { page?: string; limit?: string },
      DEFAULT_NOTIFICATIONS_LIMIT,
    );
    const result = await SocialService.getNotifications(request.authUser!.id, page, limit, skip);
    return reply.send(result);
  },

  /** GET /unread-count — get unread notification count. */
  async getUnreadCount(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await SocialService.getUnreadCount(request.authUser!.id);
    return reply.send(result);
  },

  /** PUT /read — mark notifications as read (specific IDs or all). */
  async markRead(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { ids } = NotificationReadBodySchema.parse(request.body);
    const result = await SocialService.markRead(request.authUser!.id, ids);
    return reply.send(result);
  },
};
