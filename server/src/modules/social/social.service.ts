import { SocialDal } from './social.dal';
import { computeRecipeScore } from './social.utils';
import { createNotification } from '../../shared/utils/notify';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors';
import { buildPagination } from '../../shared/utils/pagination';

import type { IComment, INotification, PaginatedResult } from '../../shared/types';

const ROUNDING_FACTOR = 10;

/** Computes a rounded average from a list of star values. */
function computeAverage(ratings: readonly { stars: number }[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, rating) => acc + rating.stars, 0);
  return Math.round((sum / ratings.length) * ROUNDING_FACTOR) / ROUNDING_FACTOR;
}

// ---------------------------------------------------------------------------
// Service — business logic with NO HTTP concerns
// ---------------------------------------------------------------------------

/** Social service — orchestrates all social actions (likes, comments, follows, saves, ratings, notifications). */
export const SocialService = {
  // ---- Likes ----

  /** Like a recipe. Throws ConflictError if already liked. */
  async likeRecipe(userId: string, recipeId: string): Promise<{ liked: boolean }> {
    const existing = await SocialDal.findLikeByUserRecipe(userId, recipeId);
    if (existing) throw new ConflictError('Like', recipeId);

    await SocialDal.createLike(userId, recipeId);
    const recipe = await SocialDal.incrementRecipeCounter(recipeId, 'likesCount', 1);

    if (recipe) {
      await createNotification({
        recipient: recipe.author.toString(),
        sender: userId,
        type: 'like',
        recipe: recipeId,
      });
    }

    return { liked: true };
  },

  /** Unlike a recipe. Throws ValidationError if not currently liked. */
  async unlikeRecipe(userId: string, recipeId: string): Promise<{ liked: boolean }> {
    const deleted = await SocialDal.deleteLike(userId, recipeId);
    if (!deleted) throw new ValidationError('Not liked');

    await SocialDal.incrementRecipeCounter(recipeId, 'likesCount', -1);
    return { liked: false };
  },

  /** Check whether a user has liked a specific recipe. */
  async getLikeStatus(userId: string, recipeId: string): Promise<{ liked: boolean }> {
    const like = await SocialDal.findLikeByUserRecipe(userId, recipeId);
    return { liked: !!like };
  },

  /** Bulk-check like status for multiple recipes. */
  async getBulkLikeStatus(userId: string, recipeIds: readonly string[]): Promise<{ likedMap: Record<string, boolean> }> {
    const likedMap = await SocialDal.bulkLikeStatusByUser(userId, recipeIds);
    return { likedMap };
  },

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
    await SocialDal.incrementRecipeCounter(comment.recipe.toString(), 'commentsCount', -1);
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
    const recipe = await SocialDal.incrementRecipeCounter(recipeId, 'savesCount', 1);

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
    return { saved: false };
  },

  /** Get saved recipes for a user with optional category filter (paginated). */
  async getSavedRecipes(
    userId: string,
    page: number,
    limit: number,
    skip: number,
    category?: string,
  ): Promise<PaginatedResult<unknown>> {
    const savedDocs = await SocialDal.findSavedByUser(userId);

    // Extract populated recipes, then filter by category after population
    let recipes = savedDocs
      .map((doc) => doc.recipe)
      .filter(Boolean) as unknown[];

    if (category && category !== 'All') {
      recipes = recipes.filter(
        (recipe) => (recipe as { category: string }).category === category,
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

  // ---- Ratings ----

  /** Rate a recipe (upserts). Recomputes the recipe's average rating. */
  async rateRecipe(
    userId: string,
    recipeId: string,
    stars: number,
  ): Promise<{ averageRating: number; ratingsCount: number }> {
    const MIN_STARS = 1;
    const MAX_STARS = 5;
    if (!stars || stars < MIN_STARS || stars > MAX_STARS) {
      throw new ValidationError('Stars must be between 1 and 5');
    }
    await SocialDal.upsertRating(userId, recipeId, stars);

    const ratings = await SocialDal.findRatingsByRecipe(recipeId);
    const averageRating = computeAverage(ratings);
    const ratingsCount = ratings.length;

    await SocialDal.updateRecipeRatingStats(recipeId, averageRating, ratingsCount);

    // Recompute recipe score and author's chef score
    const newRecipeScore = computeRecipeScore(averageRating, ratingsCount);
    await SocialDal.updateRecipeScore(recipeId, newRecipeScore);

    const recipe = await SocialDal.findRecipeById(recipeId);
    if (recipe) {
      const authorId = recipe.author.toString();
      const totalChefScore = await SocialDal.sumRecipeScoresByAuthor(authorId);
      await SocialDal.updateUserChefScore(authorId, totalChefScore);

      await createNotification({
        recipient: authorId,
        sender: userId,
        type: 'rate',
        recipe: recipeId,
      });
    }

    return { averageRating, ratingsCount };
  },

  /** Get the current user's rating for a recipe. Returns 0 if not rated. */
  async getMyRating(userId: string, recipeId: string): Promise<{ rating: number }> {
    const doc = await SocialDal.findRatingByUserRecipe(userId, recipeId);
    return { rating: doc ? doc.stars : 0 };
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
