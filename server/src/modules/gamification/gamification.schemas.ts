import { z } from 'zod';

/** Schema for the POST /cook request body. */
export const RecordCookBodySchema = z.object({
  recipeId: z.string().min(1),
});
export type RecordCookBody = z.infer<typeof RecordCookBodySchema>;
