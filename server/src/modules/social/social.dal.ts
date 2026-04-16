import mongoose from 'mongoose';

import Comment from '../../models/Comment';
import Follow from '../../models/Follow';
import SavedRecipe from '../../models/SavedRecipe';
import Notification from '../../models/Notification';
import Recipe from '../../models/Recipe';
import User from '../../models/User';

import type { IComment, IFollow, ISavedRecipe, INotification, IRecipe, IUser } from '../../shared/types';

// ---------------------------------------------------------------------------
// Social DAL
// ---------------------------------------------------------------------------

/** Data Access Layer for all social-domain Mongoose queries. */
export const SocialDal = {
  // ---- Comments ----

  /** Create a comment on a recipe. */
  async createComment(userId: string, recipeId: string, text: string, parentCommentId?: string): Promise<IComment> {
    const comment = await Comment.create({
      user: userId,
      recipe: recipeId,
      text,
      ...(parentCommentId ? { parentComment: parentCommentId } : {}),
    });
    await comment.populate('user', 'username avatar');
    return comment;
  },

  /** Find comments for a recipe (paginated, newest first). */
  async findCommentsByRecipe(
    recipeId: string,
    skip: number,
    limit: number,
  ): Promise<{ data: IComment[]; total: number }> {
    const [data, total] = await Promise.all([
      Comment.find({ recipe: recipeId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username avatar'),
      Comment.countDocuments({ recipe: recipeId }),
    ]);
    return { data, total };
  },

  /** Find a comment by ID. */
  async findCommentById(commentId: string): Promise<IComment | null> {
    return Comment.findById(commentId);
  },

  /** Delete a comment by ID. Returns the deleted doc or null. */
  async deleteComment(commentId: string): Promise<IComment | null> {
    return Comment.findByIdAndDelete(commentId);
  },

  /** Find replies to a specific comment (paginated, oldest first). */
  async findRepliesByComment(
    commentId: string,
    skip: number,
    limit: number,
  ): Promise<{ data: IComment[]; total: number }> {
    const [data, total] = await Promise.all([
      Comment.find({ parentComment: commentId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username avatar'),
      Comment.countDocuments({ parentComment: commentId }),
    ]);
    return { data, total };
  },

  /** Increment repliesCount on a comment. */
  async incrementCommentRepliesCount(commentId: string): Promise<void> {
    await Comment.findByIdAndUpdate(commentId, { $inc: { repliesCount: 1 } });
  },

  // ---- Follows ----

  /** Create a follow relationship. */
  async createFollow(followerId: string, followingId: string): Promise<IFollow> {
    return Follow.create({ follower: followerId, following: followingId });
  },

  /** Delete a follow relationship. Returns the deleted doc or null. */
  async deleteFollow(followerId: string, followingId: string): Promise<IFollow | null> {
    return Follow.findOneAndDelete({ follower: followerId, following: followingId });
  },

  /** Check if a follow relationship exists between two users. */
  async findFollowByPair(followerId: string, followingId: string): Promise<IFollow | null> {
    return Follow.findOne({ follower: followerId, following: followingId });
  },

  /** Get followers of a user (paginated). */
  async getFollowers(
    userId: string,
    skip: number,
    limit: number,
  ): Promise<{ data: IFollow[]; total: number }> {
    const [data, total] = await Promise.all([
      Follow.find({ following: userId })
        .skip(skip)
        .limit(limit)
        .populate('follower', 'username avatar bio followersCount'),
      Follow.countDocuments({ following: userId }),
    ]);
    return { data, total };
  },

  /** Get users that a user is following (paginated). */
  async getFollowing(
    userId: string,
    skip: number,
    limit: number,
  ): Promise<{ data: IFollow[]; total: number }> {
    const [data, total] = await Promise.all([
      Follow.find({ follower: userId })
        .skip(skip)
        .limit(limit)
        .populate('following', 'username avatar bio followersCount'),
      Follow.countDocuments({ follower: userId }),
    ]);
    return { data, total };
  },

  /** Get all user IDs that a given user is following. */
  async getFollowingIds(userId: string): Promise<string[]> {
    const docs = await Follow.find({ follower: userId }).select('following');
    return docs.map((doc) => doc.following.toString());
  },

  // ---- Saved Recipes ----

  /** Save a recipe for a user. */
  async createSavedRecipe(userId: string, recipeId: string): Promise<ISavedRecipe> {
    return SavedRecipe.create({ user: userId, recipe: recipeId });
  },

  /** Unsave a recipe. Returns the deleted doc or null. */
  async deleteSavedRecipe(userId: string, recipeId: string): Promise<ISavedRecipe | null> {
    return SavedRecipe.findOneAndDelete({ user: userId, recipe: recipeId });
  },

  /** Find all saved recipes for a user (with populated recipe + author). */
  async findSavedByUser(userId: string): Promise<ISavedRecipe[]> {
    return SavedRecipe.find({ user: userId })
      .sort({ savedAt: -1 })
      .populate({ path: 'recipe', populate: { path: 'author', select: 'username avatar' } });
  },

  /** Check if a user has saved a specific recipe. */
  async findSavedByUserRecipe(userId: string, recipeId: string): Promise<ISavedRecipe | null> {
    return SavedRecipe.findOne({ user: userId, recipe: recipeId });
  },

  /** Return a map of recipeId -> boolean for a list of recipes a user may have saved. */
  async bulkSaveStatusByUser(userId: string, recipeIds: readonly string[]): Promise<Record<string, boolean>> {
    const saves = await SavedRecipe.find({ user: userId, recipe: { $in: recipeIds } }).select('recipe');
    const savedMap: Record<string, boolean> = {};
    recipeIds.forEach((id) => {
      savedMap[id] = false;
    });
    saves.forEach((save) => {
      savedMap[save.recipe.toString()] = true;
    });
    return savedMap;
  },

  // ---- Notifications ----

  /** Find notifications for a recipient (paginated, newest first). */
  async findNotificationsByRecipient(
    recipientId: string,
    skip: number,
    limit: number,
  ): Promise<{ data: INotification[]; total: number }> {
    const [data, total] = await Promise.all([
      Notification.find({ recipient: recipientId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'username avatar')
        .populate('recipe', 'title coverImage'),
      Notification.countDocuments({ recipient: recipientId }),
    ]);
    return { data, total };
  },

  /** Count unread notifications for a recipient. */
  async countUnreadNotifications(recipientId: string): Promise<number> {
    return Notification.countDocuments({ recipient: recipientId, read: false });
  },

  /** Mark specific notifications (or all) as read for a recipient. */
  async markNotificationsRead(recipientId: string, ids?: readonly string[]): Promise<void> {
    if (ids && ids.length > 0) {
      await Notification.updateMany(
        { _id: { $in: ids }, recipient: recipientId },
        { read: true },
      );
      return;
    }
    await Notification.updateMany(
      { recipient: recipientId, read: false },
      { read: true },
    );
  },

  /** Find a notification by ID. */
  async findNotificationById(notificationId: string): Promise<INotification | null> {
    return Notification.findById(notificationId);
  },

  /** Delete a notification by ID. Returns the deleted doc or null. */
  async deleteNotification(notificationId: string): Promise<INotification | null> {
    return Notification.findByIdAndDelete(notificationId);
  },

  // ---- Recipe count helpers ----

  /** Increment or decrement a counter field on a Recipe. Returns the updated recipe. */
  async incrementRecipeCounter(recipeId: string, field: string, amount: number): Promise<IRecipe | null> {
    return Recipe.findByIdAndUpdate(recipeId, { $inc: { [field]: amount } }, { new: true });
  },

  /** Find a recipe by ID (for reading author info, etc.). */
  async findRecipeById(recipeId: string): Promise<IRecipe | null> {
    return Recipe.findById(recipeId);
  },

  // ---- User count helpers ----

  /** Increment or decrement a counter field on a User. */
  async incrementUserCounter(userId: string, field: string, amount: number): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, { $inc: { [field]: amount } }, { new: true });
  },

  /** Find a user by their username (case-insensitive). */
  async findUserByUsername(username: string): Promise<IUser | null> {
    return User.findOne({ username: new RegExp(`^${username}$`, 'i') });
  },

  // ---- Score helpers ----

  /** Update a recipe's computed score. */
  async updateRecipeScore(recipeId: string, recipeScore: number): Promise<void> {
    await Recipe.findByIdAndUpdate(recipeId, { recipeScore });
  },

  /** Sum all recipeScores for a given author. */
  async sumRecipeScoresByAuthor(authorId: string): Promise<number> {
    const result = await Recipe.aggregate([
      { $match: { author: new mongoose.Types.ObjectId(authorId) } },
      { $group: { _id: null, total: { $sum: '$recipeScore' } } },
    ]);
    return result[0]?.total ?? 0;
  },

  /** Update a user's chefScore. */
  async updateUserChefScore(userId: string, chefScore: number): Promise<void> {
    await User.findByIdAndUpdate(userId, { chefScore });
  },
};
