import Like from '../../models/Like';
import Comment from '../../models/Comment';
import Follow from '../../models/Follow';
import SavedRecipe from '../../models/SavedRecipe';
import Rating from '../../models/Rating';
import Notification from '../../models/Notification';
import Recipe from '../../models/Recipe';
import User from '../../models/User';

import type { ILike, IComment, IFollow, ISavedRecipe, IRating, INotification, IRecipe, IUser } from '../../shared/types';

// ---------------------------------------------------------------------------
// Like queries
// ---------------------------------------------------------------------------

/** Data Access Layer for all social-domain Mongoose queries. */
export const SocialDal = {
  // ---- Likes ----

  /** Create a like record linking a user to a recipe. */
  async createLike(userId: string, recipeId: string): Promise<ILike> {
    return Like.create({ user: userId, recipe: recipeId });
  },

  /** Delete a like by user + recipe pair. Returns the deleted doc or null. */
  async deleteLike(userId: string, recipeId: string): Promise<ILike | null> {
    return Like.findOneAndDelete({ user: userId, recipe: recipeId });
  },

  /** Find whether a specific user-recipe like exists. */
  async findLikeByUserRecipe(userId: string, recipeId: string): Promise<ILike | null> {
    return Like.findOne({ user: userId, recipe: recipeId });
  },

  /** Return a map of recipeId -> boolean for a list of recipes a user may have liked. */
  async bulkLikeStatusByUser(userId: string, recipeIds: readonly string[]): Promise<Record<string, boolean>> {
    const likes = await Like.find({ user: userId, recipe: { $in: recipeIds } }).select('recipe');
    const likedMap: Record<string, boolean> = {};
    recipeIds.forEach((id) => {
      likedMap[id] = false;
    });
    likes.forEach((like) => {
      likedMap[like.recipe.toString()] = true;
    });
    return likedMap;
  },

  // ---- Comments ----

  /** Create a comment on a recipe. */
  async createComment(userId: string, recipeId: string, text: string): Promise<IComment> {
    const comment = await Comment.create({ user: userId, recipe: recipeId, text });
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

  // ---- Ratings ----

  /** Upsert a rating for a user on a recipe. Returns the updated rating. */
  async upsertRating(userId: string, recipeId: string, stars: number): Promise<IRating> {
    const rating = await Rating.findOneAndUpdate(
      { user: userId, recipe: recipeId },
      { stars },
      { upsert: true, new: true },
    );
    // findOneAndUpdate with upsert always returns a doc
    return rating!; // safe: upsert guarantees non-null
  },

  /** Find all ratings for a recipe (for computing averages). */
  async findRatingsByRecipe(recipeId: string): Promise<IRating[]> {
    return Rating.find({ recipe: recipeId });
  },

  /** Find a specific user's rating for a recipe. */
  async findRatingByUserRecipe(userId: string, recipeId: string): Promise<IRating | null> {
    return Rating.findOne({ user: userId, recipe: recipeId });
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

  // ---- Recipe count helpers ----

  /** Increment or decrement a counter field on a Recipe. Returns the updated recipe. */
  async incrementRecipeCounter(recipeId: string, field: string, amount: number): Promise<IRecipe | null> {
    return Recipe.findByIdAndUpdate(recipeId, { $inc: { [field]: amount } }, { new: true });
  },

  /** Update a recipe's computed rating stats. */
  async updateRecipeRatingStats(recipeId: string, averageRating: number, ratingsCount: number): Promise<void> {
    await Recipe.findByIdAndUpdate(recipeId, { averageRating, ratingsCount });
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
};
