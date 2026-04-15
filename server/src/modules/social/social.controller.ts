import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

import { SocialService } from './social.service';
import { parsePaginationQuery } from '../../shared/utils/pagination';
import { addConnection } from '../../shared/utils/sse-connections';
import { env } from '../../config/env';
import {
  RecipeIdParamsSchema,
  UserIdParamsSchema,
  CreateCommentBodySchema,
  BulkStatusBodySchema,
  CommentIdParamsSchema,
  NotificationIdParamsSchema,
  NotificationReadBodySchema,
  SavedRecipesQuerySchema,
} from './social.schemas';
import { AuthUser } from '../../shared/types';

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

  /** POST /:recipeId — create a comment on a recipe (optionally a reply). */
  async createComment(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { recipeId } = request.params as { recipeId: string };
    const { text, parentCommentId } = CreateCommentBodySchema.parse(request.body);
    const result = await SocialService.createComment(request.authUser!.id, recipeId, text, parentCommentId);
    return reply.status(201).send(result);
  },

  /** GET /:recipeId/:commentId/replies — get replies for a comment. */
  async getCommentReplies(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { commentId } = CommentIdParamsSchema.parse(request.params);
    const { page, limit, skip } = parsePaginationQuery(
      request.query as { page?: string; limit?: string },
      DEFAULT_COMMENTS_LIMIT,
    );
    const result = await SocialService.getCommentReplies(commentId, page, limit, skip);
    return reply.send(result);
  },

  /** DELETE /:commentId — delete a comment. */
  async deleteComment(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { commentId } = CommentIdParamsSchema.parse(request.params);
    const result = await SocialService.deleteComment(request.authUser!.id, commentId);
    return reply.send(result);
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
      query.tag,
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

  // ---- Notifications ----

  /** GET /stream — SSE stream for real-time notification delivery. */
  async notificationStream(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { token } = request.query as { token?: string };
    if (!token) {
      return reply.status(401).send({ error: { message: 'Not authenticated', status: 401 } });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
      userId = decoded.id;
    } catch {
      return reply.status(401).send({ error: { message: 'Invalid token', status: 401 } });
    }

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    reply.raw.write('\n');

    addConnection(userId, reply);
  },

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

  /** DELETE /:notificationId — delete a notification. */
  async deleteNotification(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { notificationId } = NotificationIdParamsSchema.parse(request.params);
    const result = await SocialService.deleteNotification(request.authUser!.id, notificationId);
    return reply.send(result);
  },
};
