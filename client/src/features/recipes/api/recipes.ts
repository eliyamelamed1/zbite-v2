import api from '../../../api/axios';
import { Recipe, PaginatedResponse } from '../../../types';

export const createRecipe = (formData: FormData) =>
  api.post<{ recipe: Recipe }>('/recipes', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getRecipe = (id: string) => api.get<{ recipe: Recipe }>(`/recipes/${id}`);

export const getRelatedRecipes = (id: string) => api.get<{ data: Recipe[] }>(`/recipes/${id}/related`);

export const updateRecipe = (id: string, formData: FormData) =>
  api.put<{ recipe: Recipe }>(`/recipes/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const deleteRecipe = (id: string) => api.delete(`/recipes/${id}`);

export const getExploreFeed = (page = 1, sort = 'recent', tag?: string, limit?: number) => {
  let url = `/recipes/explore?page=${page}&sort=${sort}`;
  if (tag && tag !== 'All') url += `&tag=${encodeURIComponent(tag)}`;
  if (limit) url += `&limit=${limit}`;
  return api.get<PaginatedResponse<Recipe>>(url);
};

export const getFollowingFeed = (page = 1) =>
  api.get<PaginatedResponse<Recipe>>(`/recipes/following?page=${page}`);

export const getUserRecipes = (userId: string, page = 1) =>
  api.get<PaginatedResponse<Recipe>>(`/recipes/user/${userId}?page=${page}`);

export const saveRecipe = (recipeId: string) => api.post(`/saved/${recipeId}`);
export const unsaveRecipe = (recipeId: string) => api.delete(`/saved/${recipeId}`);
export const getSaveStatus = (recipeId: string) => api.get<{ saved: boolean }>(`/saved/${recipeId}/status`);
export const getSavedRecipes = (page = 1, tag?: string) => {
  let url = `/saved?page=${page}`;
  if (tag && tag !== 'All') url += `&tag=${encodeURIComponent(tag)}`;
  return api.get<PaginatedResponse<Recipe>>(url);
};
export const bulkSaveStatus = (recipeIds: string[]) =>
  api.post<{ savedMap: Record<string, boolean> }>('/saved/bulk-status', { recipeIds });

/** Fetch the authenticated user's draft recipes. */
export const getDrafts = (page = 1) =>
  api.get<PaginatedResponse<Recipe>>(`/recipes/drafts?page=${page}`);

/** Full-text search for published recipes by title and description. */
export const searchRecipes = (query: string, page = 1) =>
  api.get<PaginatedResponse<Recipe>>(`/recipes/search?q=${encodeURIComponent(query)}&page=${page}`);

/** Response shape from the recommendation endpoint. */
interface RecommendResponse {
  data: Recipe[];
  usuals: Recipe[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

/** Fetch category-based recommendations (Help Me Decide path). */
export const getPickRecommendations = (
  page: number,
  category: string,
  minTime?: number,
  maxTime?: number,
  preference?: string,
) => {
  let url = `/recipes/recommend?mode=pick&page=${page}&category=${category}`;
  if (minTime) url += `&minTime=${minTime}`;
  if (maxTime) url += `&maxTime=${maxTime}`;
  if (preference) url += `&preference=${preference}`;
  return api.get<RecommendResponse>(url);
};

/** Fetch ingredient-based recommendations (Use What I Have path). */
export const getPantryRecommendations = (
  page: number,
  ingredients: string[],
  maxTime?: number,
) => {
  let url = `/recipes/recommend?mode=pantry&page=${page}&ingredients=${ingredients.join(',')}`;
  if (maxTime) url += `&maxTime=${maxTime}`;
  return api.get<RecommendResponse>(url);
};

/** Response shape for the home endpoint. */
interface HomeResponse {
  goTo: Recipe[];
  interestRows: { interest: string; recipes: Recipe[] }[];
  quickTonight: Recipe[];
  trending: Recipe[];
  newThisWeek: Recipe[];
}

/** Fetch personalized home page data. */
export const getHomeData = () => api.get<HomeResponse>('/recipes/home');
