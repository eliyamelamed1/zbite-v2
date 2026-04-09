import { z } from 'zod';

export const RecipeIdParamsSchema = z.object({
  recipeId: z.string().min(1),
});

export const CreateReportBodySchema = z.object({
  notes: z.string().max(500).optional().default(''),
});

export type RecipeIdParams = z.infer<typeof RecipeIdParamsSchema>;
export type CreateReportBody = z.infer<typeof CreateReportBodySchema>;
