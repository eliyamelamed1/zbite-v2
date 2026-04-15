import { SocialDal } from './social.dal';
import { computeRecipeScore } from './social.utils';
import { createNotification } from '../../shared/utils/notify';
import { trackActivity } from '../../shared/utils/track-activity';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors';
import { buildPagination } from '../../shared/utils/pagination';

import type { IComment, INotification, PaginatedResult } from '../../shared/types';

// ---------------------------------------------------------------------------
// Service — business logic with NO HTTP concerns
// ---------------------------------------------------------------------------

/**
 * Recompute a recipe's engagement score and update both the recipe and its author's chefScore.
 * Call after any action that changes savesCount, commentsCount, or reportsCount.
 */
async function recomputeRecipeScore(recipeId: string): Promise<void> {
  const recipe = await SocialDal.findRecipeById(recipeId);
  if (!recipe) return;

  const newScore = computeRecipeScore({
    savesCount: recipe.savesCount,
    commentsCount: recipe.commentsCount,
    reportsCount: recipe.reportsCount,
  });

  await SocialDal.updateRecipeScore(recipeId, newScore);

  const authorId = recipe.author.toString();
  const totalChefScore = await SocialDal.sumRecipeScoresByAuthor(authorId);
  await SocialDal.updateUserChefScore(authorId, totalChefScore);
}

/** Social service — orchestrates all social actions (comments, follows, saves, notifications). */
export const SocialService = {
  // ---- Score ----

  /** Exposed for use by other modules (e.g. cooking-report). */
  recomputeRecipeScore,

  // ---- Comments ----

  /** Create a comment on a recipe, optionally as a reply to another comment. */
  async createComment(userId: string, recipeId: string, text: string, parentCommentId?: string): Promise<{ comment: IComment }> {
    const trimmedText = text.trim();
    if (!trimmedText) throw new ValidationError('Comment text is required');

    // Validate parent comment exists when replying
    if (parentCommentId) {
      const parentComment = await SocialDal.findCommentById(parentCommentId);
      if (!parentComment) throw new NotFoundError('Comment', parentCommentId);
    }

    const comment = await SocialDal.createComment(userId, recipeId, trimmedText, parentCommentId);
    const recipe = await SocialDal.incrementRecipeCounter(recipeId, 'commentsCount', 1);
    await recomputeRecipeScore(recipeId);

    if (recipe) {
      await createNotification({
        recipient: recipe.author.toString(),
        sender: userId,
        type: 'comment',
        recipe: recipeId,
      });
    }

    // Notify parent comment author when replying
    if (parentCommentId) {
      await SocialDal.incrementCommentRepliesCount(parentCommentId);

      const parentComment = await SocialDal.findCommentById(parentCommentId);
      if (parentComment) {
        const parentAuthorId = parentComment.user.toString();
        // Skip notification if replying to own comment
        if (parentAuthorId !== userId) {
          await createNotification({
            recipient: parentAuthorId,
            sender: userId,
            type: 'comment',
            recipe: recipeId,
          });
        }
      }
    }

    // Parse @mentions from comment text
    const mentionPattern = /@(\w+)/g;
    const mentionedUsernames = [...new Set(
      Array.from(trimmedText.matchAll(mentionPattern), (match) => match[1]),
    )];

    if (mentionedUsernames.length > 0) {
      await this.notifyMentionedUsers(userId, recipeId, mentionedUsernames);
    }

    return { comment };
  },

  /** Send mention notifications to all valid @mentioned users in a comment. */
  async notifyMentionedUsers(
    senderId: string,
    recipeId: string,
    usernames: readonly string[],
  ): Promise<void> {
    for (const username of usernames) {
      const mentionedUser = await SocialDal.findUserByUsername(username);
      if (!mentionedUser) continue;

      const mentionedUserId = mentionedUser._id.toString();
      // Skip self-mentions
      if (mentionedUserId === senderId) continue;

      await createNotification({
        recipient: mentionedUserId,
        sender: senderId,
        type: 'mention',
        recipe: recipeId,
      });
    }
  },

  /** Get paginated replies for a comment. */
  async getCommentReplies(commentId: string, page: number, limit: number, skip: number): Promise<PaginatedResult<IComment>> {
    const { data, total } = await SocialDal.findRepliesByComment(commentId, skip, limit);
    return { data, pagination: buildPagination(page, limit, total) };
  },

  /** Get paginated comments for a recipe. */
  async getComments(recipeId: string, page: number, limit: number, skip: number): Promise<PaginatedResult<IComment>> {
    const { data, total } = await SocialDal.findCommentsByRecipe(recipeId, skip, limit);
    return { data, pagination: buildPagination(page, limit, total) };
  },

  /** Delete a comment. Only the comment author may delete it. */
  async deleteComment(userId: string, commentId: string): Promise<{ deleted: boolean }> {
    const comment = await SocialDal.findCommentById(commentId);
    if (!comment) throw new NotFoundError('Comment', commentId);
    if (comment.user.toString() !== userId) {
      throw new ForbiddenError('Cannot delete another user\'s comment');
    }

    await SocialDal.deleteComment(commentId);
    const commentRecipeId = comment.recipe.toString();
    await SocialDal.incrementRecipeCounter(commentRecipeId, 'commentsCount', -1);
    await recomputeRecipeScore(commentRecipeId);
    return { deleted: true };
  },

  // ---- Follows ----

  /** Follow a user. Throws ValidationError if targeting self, ConflictError if already following. */
  async followUser(followerId: string, followingId: string): Promise<{ following: boolean }> {
    if (followerId === followingId) throw new ValidationError('Cannot follow yourself');

    const existing = await SocialDal.findFollowByPair(followerId, followingId);
    if (existing) throw new ConflictError('Follow', followingId);

    await SocialDal.createFollow(followerId, followingId);
    await Promise.all([
      SocialDal.incrementUserCounter(followerId, 'followingCount', 1),
      SocialDal.incrementUserCounter(followingId, 'followersCount', 1),
    ]);

    await createNotification({
      recipient: followingId,
      sender: followerId,
      type: 'follow',
    });

    return { following: true };
  },

  /** Unfollow a user. Throws ValidationError if not currently following. */
  async unfollowUser(followerId: string, followingId: string): Promise<{ following: boolean }> {
    const deleted = await SocialDal.deleteFollow(followerId, followingId);
    if (!deleted) throw new ValidationError('Not following');

    await Promise.all([
      SocialDal.incrementUserCounter(followerId, 'followingCount', -1),
      SocialDal.incrementUserCounter(followingId, 'followersCount', -1),
    ]);

    return { following: false };
  },

  /** Get paginated followers for a user. */
  async getFollowers(userId: string, page: number, limit: number, skip: number): Promise<PaginatedResult<unknown>> {
    const { data, total } = await SocialDal.getFollowers(userId, skip, limit);
    const users = data.map((doc) => doc.follower);
    return { data: users, pagination: buildPagination(page, limit, total) };
  },

  /** Get paginated following list for a user. */
  async getFollowing(userId: string, page: number, limit: number, skip: number): Promise<PaginatedResult<unknown>> {
    const { data, total } = await SocialDal.getFollowing(userId, skip, limit);
    const users = data.map((doc) => doc.following);
    return { data: users, pagination: buildPagination(page, limit, total) };
  },

  /** Check whether the current user is following a target user. */
  async getFollowStatus(followerId: string, followingId: string): Promise<{ following: boolean }> {
    const follow = await SocialDal.findFollowByPair(followerId, followingId);
    return { following: !!follow };
  },

  // ---- Saved Recipes ----

  /** Save a recipe. Throws ConflictError if already saved. */
  async saveRecipe(userId: string, recipeId: string): Promise<{ saved: boolean }> {
    const existing = await SocialDal.findSavedByUserRecipe(userId, recipeId);
    if (existing) throw new ConflictError('SavedRecipe', recipeId);

    await SocialDal.createSavedRecipe(userId, recipeId);
    trackActivity(userId, 'save', recipeId);
    const recipe = await SocialDal.incrementRecipeCounter(recipeId, 'savesCount', 1);
    await recomputeRecipeScore(recipeId);

    if (recipe) {
      await createNotification({
        recipient: recipe.author.toString(),
        sender: userId,
        type: 'save',
        recipe: recipeId,
      });
    }

    return { saved: true };
  },

  /** Unsave a recipe. Throws ValidationError if not currently saved. */
  async unsaveRecipe(userId: string, recipeId: string): Promise<{ saved: boolean }> {
    const deleted = await SocialDal.deleteSavedRecipe(userId, recipeId);
    if (!deleted) throw new ValidationError('Recipe not saved');

    await SocialDal.incrementRecipeCounter(recipeId, 'savesCount', -1);
    await recomputeRecipeScore(recipeId);
    return { saved: false };
  },

  /** Get saved recipes for a user with optional tag filter (paginated). */
  async getSavedRecipes(
    userId: string,
    page: number,
    limit: number,
    skip: number,
    tag?: string,
  ): Promise<PaginatedResult<unknown>> {
    const savedDocs = await SocialDal.findSavedByUser(userId);

    // Extract populated recipes, then filter by tag after population
    let recipes = savedDocs
      .map((doc) => doc.recipe)
      .filter(Boolean) as unknown[];

    if (tag && tag !== 'All') {
      recipes = recipes.filter(
        (recipe) => (recipe as { tags: string[] }).tags.includes(tag),
      );
    }

    const total = recipes.length;
    const data = recipes.slice(skip, skip + limit);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  /** Check if a user has saved a specific recipe. */
  async getSaveStatus(userId: string, recipeId: string): Promise<{ saved: boolean }> {
    const saved = await SocialDal.findSavedByUserRecipe(userId, recipeId);
    return { saved: !!saved };
  },

  /** Bulk-check save status for multiple recipes. */
  async getBulkSaveStatus(userId: string, recipeIds: readonly string[]): Promise<{ savedMap: Record<string, boolean> }> {
    const savedMap = await SocialDal.bulkSaveStatusByUser(userId, recipeIds);
    return { savedMap };
  },

  // ---- Notifications ----

  /** Get paginated notifications for the authenticated user. */
  async getNotifications(
    recipientId: string,
    page: number,
    limit: number,
    skip: number,
  ): Promise<PaginatedResult<INotification>> {
    const { data, total } = await SocialDal.findNotificationsByRecipient(recipientId, skip, limit);
    return { data, pagination: buildPagination(page, limit, total) };
  },

  /** Get unread notification count. */
  async getUnreadCount(recipientId: string): Promise<{ count: number }> {
    const count = await SocialDal.countUnreadNotifications(recipientId);
    return { count };
  },

  /** Mark specific (or all) notifications as read. */
  async markRead(recipientId: string, ids?: readonly string[]): Promise<{ success: boolean }> {
    await SocialDal.markNotificationsRead(recipientId, ids);
    return { success: true };
  },

  /** Delete a notification. Only the recipient may delete it. */
  async deleteNotification(recipientId: string, notificationId: string): Promise<{ deleted: boolean }> {
    const notification = await SocialDal.findNotificationById(notificationId);
    if (!notification) throw new NotFoundError('Notification', notificationId);
    if (notification.recipient.toString() !== recipientId) {
      throw new ForbiddenError('Cannot delete another user\'s notification');
    }

    await SocialDal.deleteNotification(notificationId);
    return { deleted: true };
  },
};
