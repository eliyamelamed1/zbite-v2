import FeedbackItem from '../../models/FeedbackItem';

import type { IFeedbackItem } from '../../models/FeedbackItem';
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
        .sort({ createdAt: -1 })
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
};
