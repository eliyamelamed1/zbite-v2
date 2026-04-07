import { z } from 'zod';

/** Query string schema for user search. */
export const SearchUsersQuerySchema = z.object({
  q: z.string().min(1).max(50),
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type SearchUsersQuery = z.infer<typeof SearchUsersQuerySchema>;

/** Route params schema for fetching a user profile by ID. */
export const ProfileParamsSchema = z.object({
  id: z.string().min(1),
});
export type ProfileParams = z.infer<typeof ProfileParamsSchema>;

/** Body schema for profile updates (text fields only — avatar handled via multipart). */
export const UpdateProfileBodySchema = z.object({
  bio: z.string().max(300).optional(),
});
export type UpdateProfileBody = z.infer<typeof UpdateProfileBodySchema>;
