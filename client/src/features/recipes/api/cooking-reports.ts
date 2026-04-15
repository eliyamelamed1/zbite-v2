import api from '../../../api/axios';

/** Report that the user cooked a recipe. */
export const createCookingReport = (recipeId: string) =>
  api.post(`/cooking-reports/${recipeId}/reports`);
