import CookingReport from '../../models/CookingReport';
import Recipe from '../../models/Recipe';
import { buildPagination } from '../../shared/utils/pagination';

import type { ICookingReport } from '../../models/CookingReport';

const USER_SUMMARY_FIELDS = 'username avatar';

interface PaginatedFeedOptions {
  page: number;
  limit: number;
  skip: number;
}

/** Data Access Layer for cooking report queries. */
export const CookingReportDal = {
  /** Create a new cooking report and populate its user field. */
  async createReport(
    userId: string,
    recipeId: string,
    image: string,
    notes: string,
  ): Promise<ICookingReport> {
    const report = await CookingReport.create({
      user: userId,
      recipe: recipeId,
      image,
      notes,
    });

    await report.populate('user', USER_SUMMARY_FIELDS);
    return report;
  },

  /** Find cooking reports for a recipe, paginated, newest first. */
  async findReportsByRecipe(
    recipeId: string,
    options: PaginatedFeedOptions,
  ) {
    const { page, limit, skip } = options;
    const filter = { recipe: recipeId };

    const [data, total] = await Promise.all([
      CookingReport.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', USER_SUMMARY_FIELDS),
      CookingReport.countDocuments(filter),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  /** Increment the reportsCount on a recipe document. */
  async incrementRecipeReportsCount(recipeId: string): Promise<void> {
    await Recipe.findByIdAndUpdate(recipeId, { $inc: { reportsCount: 1 } });
  },
};
