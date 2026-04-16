import { Types } from 'mongoose';

import FeedbackItem from '../../models/FeedbackItem';
import FeedbackVote from '../../models/FeedbackVote';

import type { IFeedbackItem } from '../../models/FeedbackItem';
import type { IFeedbackVote } from '../../models/FeedbackVote';
import type { CreateFeedbackBody, UpdateFeedbackBody } from './feedback.schemas';

const USER_SUMMARY_FIELDS = 'username avatar';

/** Data Access Layer for feedback-related Mongoose queries. */
export const FeedbackDal = {
  /** Create a new feedback item. */
  async create(data: CreateFeedbackBody & { user: string | null }): Promise<IFeedbackItem> {
    return FeedbackItem.create(data);
  },

  /** Find a feedback item by ID. */
  async findById(id: string): Promise<IFeedbackItem | null> {
    return FeedbackItem.findById(id).populate('user', USER_SUMMARY_FIELDS);
  },

  /** Find public feedback items with optional status filter, paginated. */
  async findPublic(options: {
    status?: string;
    skip: number;
    limit: number;
  }): Promise<{ data: IFeedbackItem[]; total: number }> {
    const filter: Record<string, unknown> = { isPublic: true };
    if (options.status) {
      filter.status = options.status;
    }

    const [data, total] = await Promise.all([
      FeedbackItem.find(filter)
        .sort({ votesCount: -1, createdAt: -1 })
        .skip(options.skip)
        .limit(options.limit)
        .populate('user', USER_SUMMARY_FIELDS),
      FeedbackItem.countDocuments(filter),
    ]);

    return { data, total };
  },

  /** Find all feedback items submitted by a specific user. */
  async findByUser(userId: string): Promise<IFeedbackItem[]> {
    return FeedbackItem.find({ user: userId }).sort({ createdAt: -1 });
  },

  /** Update a feedback item by ID. */
  async updateById(id: string, data: UpdateFeedbackBody): Promise<IFeedbackItem | null> {
    return FeedbackItem.findByIdAndUpdate(id, { $set: data }, { new: true })
      .populate('user', USER_SUMMARY_FIELDS);
  },

  /** Create a vote for a feedback item. Returns null if duplicate (unique constraint). */
  async createVote(userId: string, feedbackId: string): Promise<IFeedbackVote | null> {
    try {
      return await FeedbackVote.create({ user: userId, feedbackItem: feedbackId });
    } catch (err: unknown) {
      const mongoErr = err as { code?: number };
      if (mongoErr.code === 11000) return null;
      throw err;
    }
  },

  /** Delete a vote. Returns true if a vote was deleted. */
  async deleteVote(userId: string, feedbackId: string): Promise<boolean> {
    const result = await FeedbackVote.deleteOne({ user: userId, feedbackItem: feedbackId });
    return result.deletedCount > 0;
  },

  /** Check if a user has voted on a feedback item. */
  async findVote(userId: string, feedbackId: string): Promise<IFeedbackVote | null> {
    return FeedbackVote.findOne({ user: userId, feedbackItem: feedbackId });
  },

  /** Increment or decrement votesCount on a feedback item. */
  async incrementVotesCount(feedbackId: string, amount: number): Promise<void> {
    await FeedbackItem.findByIdAndUpdate(feedbackId, { $inc: { votesCount: amount } });
  },

  /** Return the set of feedback IDs that a user has voted on, from a given list. */
  async getVotedIds(userId: string, feedbackIds: string[]): Promise<Set<string>> {
    const objectIds = feedbackIds.map((id) => new Types.ObjectId(id));
    const votes = await FeedbackVote.find({
      user: userId,
      feedbackItem: { $in: objectIds },
    }).select('feedbackItem');
    return new Set(votes.map((v) => v.feedbackItem.toString()));
  },

  /** Find all feedback items (admin view), optionally filtered by status, paginated. */
  async findAll(options: {
    status?: string;
    skip: number;
    limit: number;
  }): Promise<{ data: IFeedbackItem[]; total: number }> {
    const filter: Record<string, unknown> = {};
    if (options.status) {
      filter.status = options.status;
    }

    const [data, total] = await Promise.all([
      FeedbackItem.find(filter)
        .sort({ createdAt: -1 })
        .skip(options.skip)
        .limit(options.limit)
        .populate('user', USER_SUMMARY_FIELDS),
      FeedbackItem.countDocuments(filter),
    ]);

    return { data, total };
  },
};
