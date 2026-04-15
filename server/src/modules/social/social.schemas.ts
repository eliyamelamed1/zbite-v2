import { z } from 'zod';

// ---------------------------------------------------------------------------
// Param schemas (route params)
// ---------------------------------------------------------------------------

/** Schema for routes that require a recipeId param. */
export const RecipeIdParamsSchema = z.object({
  recipeId: z.string().min(1),
});
export type RecipeIdParams = z.infer<typeof RecipeIdParamsSchema>;

/** Schema for routes that require a userId param. */
export const UserIdParamsSchema = z.object({
  userId: z.string().min(1),
});
export type UserIdParams = z.infer<typeof UserIdParamsSchema>;

/** Schema for routes that require a commentId param. */
export const CommentIdParamsSchema = z.object({
  commentId: z.string().min(1),
});
export type CommentIdParams = z.infer<typeof CommentIdParamsSchema>;

/** Schema for routes that require a notificationId param. */
export const NotificationIdParamsSchema = z.object({
  notificationId: z.string().min(1),
});
export type NotificationIdParams = z.infer<typeof NotificationIdParamsSchema>;

// ---------------------------------------------------------------------------
// Body schemas
// ---------------------------------------------------------------------------

/** Schema for creating a comment. */
export const CreateCommentBodySchema = z.object({
  text: z.string().trim().min(1, 'Comment text is required').max(1000),
  parentCommentId: z.string().min(1).optional(),
});
export type CreateCommentBody = z.infer<typeof CreateCommentBodySchema>;

/** Schema for bulk-checking save status on a list of recipe IDs. */
export const BulkStatusBodySchema = z.object({
  recipeIds: z.array(z.string().min(1)).min(1).max(100),
});
export type BulkStatusBody = z.infer<typeof BulkStatusBodySchema>;

/** Schema for marking notifications as read (specific IDs or all). */
export const NotificationReadBodySchema = z.object({
  ids: z.array(z.string().min(1)).optional(),
});
export type NotificationReadBody = z.infer<typeof NotificationReadBodySchema>;

// ---------------------------------------------------------------------------
// Query schemas
// ---------------------------------------------------------------------------

/** Schema for paginated queries. */
export const PaginationQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/** Schema for saved recipes query (with optional tag filter). */
export const SavedRecipesQuerySchema = PaginationQuerySchema.extend({
  tag: z.string().optional(),
});
export type SavedRecipesQuery = z.infer<typeof SavedRecipesQuerySchema>;
