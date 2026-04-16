import { FeedbackDal } from './feedback.dal';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../../shared/errors';
import { buildPagination } from '../../shared/utils/pagination';

import type { IFeedbackItem } from '../../models/FeedbackItem';
import type { PaginatedResult } from '../../shared/types';
import type { CreateFeedbackBody, UpdateFeedbackBody } from './feedback.schemas';

interface PublicFeedbackResult extends PaginatedResult<IFeedbackItem> {
  userVotedIds: string[];
}

/** Feedback service — business logic with NO HTTP concerns. */
export const FeedbackService = {
  /** Submit a new feedback item. Defaults to isPublic=false (admin must approve). */
  async submit(body: CreateFeedbackBody, userId: string | null): Promise<IFeedbackItem> {
    return FeedbackDal.create({ ...body, user: userId });
  },

  /** Get public feedback items, optionally filtered by status. Includes user vote status if userId provided. */
  async getPublic(options: {
    status?: string;
    page: number;
    limit: number;
    skip: number;
    userId?: string;
  }): Promise<PublicFeedbackResult> {
    const { status, page, limit, skip, userId } = options;
    const { data, total } = await FeedbackDal.findPublic({ status, skip, limit });

    let userVotedIds: string[] = [];
    if (userId && data.length > 0) {
      const feedbackIds = data.map((item) => item._id.toString());
      const votedSet = await FeedbackDal.getVotedIds(userId, feedbackIds);
      userVotedIds = Array.from(votedSet);
    }

    return { data, pagination: buildPagination(page, limit, total), userVotedIds };
  },

  /** Get the current user's own feedback submissions. */
  async getMine(userId: string): Promise<IFeedbackItem[]> {
    return FeedbackDal.findByUser(userId);
  },

  /** Admin: list all feedback items (regardless of isPublic). */
  async getAll(options: {
    status?: string;
    page: number;
    limit: number;
    skip: number;
  }, isAdmin: boolean): Promise<PaginatedResult<IFeedbackItem>> {
    if (!isAdmin) throw new ForbiddenError('Only admins can view all feedback');

    const { status, page, limit, skip } = options;
    const { data, total } = await FeedbackDal.findAll({ status, skip, limit });
    return { data, pagination: buildPagination(page, limit, total) };
  },

  /** Vote on a feedback item. Throws ConflictError if already voted. */
  async vote(userId: string, feedbackId: string): Promise<void> {
    const existing = await FeedbackDal.findById(feedbackId);
    if (!existing) throw new NotFoundError('FeedbackItem', feedbackId);

    const created = await FeedbackDal.createVote(userId, feedbackId);
    if (!created) throw new ConflictError('FeedbackVote', 'Already voted');

    await FeedbackDal.incrementVotesCount(feedbackId, 1);
  },

  /** Remove vote from a feedback item. Throws ValidationError if not voted. */
  async unvote(userId: string, feedbackId: string): Promise<void> {
    const deleted = await FeedbackDal.deleteVote(userId, feedbackId);
    if (!deleted) throw new ValidationError('Not voted on this item');

    await FeedbackDal.incrementVotesCount(feedbackId, -1);
  },

  /** Admin: update a feedback item's status, visibility, or response. */
  async adminUpdate(feedbackId: string, body: UpdateFeedbackBody, isAdmin: boolean): Promise<IFeedbackItem> {
    if (!isAdmin) throw new ForbiddenError('Only admins can update feedback items');

    const existing = await FeedbackDal.findById(feedbackId);
    if (!existing) throw new NotFoundError('FeedbackItem', feedbackId);

    const updated = await FeedbackDal.updateById(feedbackId, body);
    if (!updated) throw new NotFoundError('FeedbackItem', feedbackId);
    return updated;
  },
};
