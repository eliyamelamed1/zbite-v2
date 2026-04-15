import { FeedbackDal } from './feedback.dal';
import { NotFoundError, ForbiddenError } from '../../shared/errors';
import { buildPagination } from '../../shared/utils/pagination';

import type { IFeedbackItem } from '../../models/FeedbackItem';
import type { PaginatedResult } from '../../shared/types';
import type { CreateFeedbackBody, UpdateFeedbackBody } from './feedback.schemas';

/** Feedback service — business logic with NO HTTP concerns. */
export const FeedbackService = {
  /** Submit a new feedback item. Defaults to isPublic=false (admin must approve). */
  async submit(body: CreateFeedbackBody, userId: string | null): Promise<IFeedbackItem> {
    return FeedbackDal.create({ ...body, user: userId });
  },

  /** Get public feedback items, optionally filtered by status. */
  async getPublic(options: {
    status?: string;
    page: number;
    limit: number;
    skip: number;
  }): Promise<PaginatedResult<IFeedbackItem>> {
    const { status, page, limit, skip } = options;
    const { data, total } = await FeedbackDal.findPublic({ status, skip, limit });
    return { data, pagination: buildPagination(page, limit, total) };
  },

  /** Get the current user's own feedback submissions. */
  async getMine(userId: string): Promise<IFeedbackItem[]> {
    return FeedbackDal.findByUser(userId);
  },

  /** Admin: update a feedback item's status, visibility, or response. */
  async adminUpdate(feedbackId: string, body: UpdateFeedbackBody): Promise<IFeedbackItem> {
    const existing = await FeedbackDal.findById(feedbackId);
    if (!existing) throw new NotFoundError('FeedbackItem', feedbackId);

    const updated = await FeedbackDal.updateById(feedbackId, body);
    if (!updated) throw new NotFoundError('FeedbackItem', feedbackId);
    return updated;
  },
};
