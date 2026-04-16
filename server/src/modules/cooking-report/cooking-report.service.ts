import { MultipartFile } from '@fastify/multipart';

import { CookingReportDal } from './cooking-report.dal';
import { SocialService } from '../social/social.service';
import { NotFoundError } from '../../shared/errors';
import { saveFile } from '../../plugins/upload';
import { createNotification } from '../../shared/utils/notify';
import Recipe from '../../models/Recipe';

import type { ICookingReport } from '../../models/CookingReport';
import type { PaginatedResult } from '../../shared/types';

const REPORTS_UPLOAD_FOLDER = 'reports';

interface CreateReportInput {
  userId: string;
  recipeId: string;
  imageFile: MultipartFile | null;
  notes: string;
}

interface GetReportsOptions {
  recipeId: string;
  page: number;
  limit: number;
  skip: number;
}

/** Cooking report business logic -- no HTTP concerns. */
export const CookingReportService = {
  /** Create a cooking report with an image, increment counter, and notify recipe author. */
  async createReport(input: CreateReportInput): Promise<ICookingReport> {
    const { userId, recipeId, imageFile, notes } = input;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) throw new NotFoundError('Recipe', recipeId);

    const image = imageFile ? await saveFile(imageFile, REPORTS_UPLOAD_FOLDER) : '';

    const report = await CookingReportDal.createReport(userId, recipeId, image, notes);
    await CookingReportDal.incrementRecipeReportsCount(recipeId);
    await SocialService.recomputeRecipeScore(recipeId);

    await createNotification({
      recipient: recipe.author.toString(),
      sender: userId,
      type: 'cooking_report',
      recipe: recipeId,
    });

    return report;
  },

  /** Get paginated cooking reports for a recipe. */
  async getReports(options: GetReportsOptions): Promise<PaginatedResult<ICookingReport>> {
    const { recipeId, page, limit, skip } = options;
    return CookingReportDal.findReportsByRecipe(recipeId, { page, limit, skip });
  },
};
