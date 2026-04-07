import api from './axios';
import { Recipe, PaginatedResponse } from '../types';

export const createRecipe = (formData: FormData) =>
  api.post<{ recipe: Recipe }>('/recipes', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getRecipe = (id: string) => api.get<{ recipe: Recipe }>(`/recipes/${id}`);

export const updateRecipe = (id: string, formData: FormData) =>
  api.put<{ recipe: Recipe }>(`/recipes/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const deleteRecipe = (id: string) => api.delete(`/recipes/${id}`);

export const getExploreFeed = (page = 1, sort = 'recent', category?: string) => {
  let url = `/recipes/explore?page=${page}&sort=${sort}`;
  if (category && category !== 'All') url += `&category=${encodeURIComponent(category)}`;
  return api.get<PaginatedResponse<Recipe>>(url);
};

export const getFollowingFeed = (page = 1) =>
  api.get<PaginatedResponse<Recipe>>(`/recipes/following?page=${page}`);

export const getUserRecipes = (userId: string, page = 1) =>
  api.get<PaginatedResponse<Recipe>>(`/recipes/user/${userId}?page=${page}`);

export const rateRecipe = (recipeId: string, stars: number) =>
  api.post<{ averageRating: number; ratingsCount: number }>(`/ratings/${recipeId}`, { stars });

export const getMyRating = (recipeId: string) =>
  api.get<{ rating: number }>(`/ratings/${recipeId}/me`);

export const saveRecipe = (recipeId: string) => api.post(`/saved/${recipeId}`);
export const unsaveRecipe = (recipeId: string) => api.delete(`/saved/${recipeId}`);
export const getSaveStatus = (recipeId: string) => api.get<{ saved: boolean }>(`/saved/${recipeId}/status`);
export const getSavedRecipes = (page = 1, category?: string) => {
  let url = `/saved?page=${page}`;
  if (category && category !== 'All') url += `&category=${encodeURIComponent(category)}`;
  return api.get<PaginatedResponse<Recipe>>(url);
};
export const bulkSaveStatus = (recipeIds: string[]) =>
  api.post<{ savedMap: Record<string, boolean> }>('/saved/bulk-status', { recipeIds });
