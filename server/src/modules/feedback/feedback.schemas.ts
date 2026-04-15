import { z } from 'zod';

const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 1000;

const FEEDBACK_CATEGORIES = ['feature', 'improvement', 'bug', 'other'] as const;
const FEEDBACK_STATUSES = ['new', 'planned', 'in_progress', 'shipped', 'not_planned'] as const;

/** Schema for submitting feedback (POST /api/feedback). */
export const CreateFeedbackBodySchema = z.object({
  title: z.string().min(1).max(TITLE_MAX_LENGTH),
  description: z.string().min(1).max(DESCRIPTION_MAX_LENGTH),
  category: z.enum(FEEDBACK_CATEGORIES),
  guestEmail: z.string().email().optional(),
});
export type CreateFeedbackBody = z.infer<typeof CreateFeedbackBodySchema>;

/** Schema for admin-updating feedback (PATCH /api/feedback/:id). */
export const UpdateFeedbackBodySchema = z.object({
  status: z.enum(FEEDBACK_STATUSES).optional(),
  isPublic: z.boolean().optional(),
  adminResponse: z.string().max(DESCRIPTION_MAX_LENGTH).optional(),
});
export type UpdateFeedbackBody = z.infer<typeof UpdateFeedbackBodySchema>;

/** Schema for feedback ID route param. */
export const FeedbackIdParamsSchema = z.object({
  id: z.string().min(1),
});
export type FeedbackIdParams = z.infer<typeof FeedbackIdParamsSchema>;

/** Schema for public feedback query params. */
export const PublicFeedbackQuerySchema = z.object({
  status: z.enum(FEEDBACK_STATUSES).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type PublicFeedbackQuery = z.infer<typeof PublicFeedbackQuerySchema>;
