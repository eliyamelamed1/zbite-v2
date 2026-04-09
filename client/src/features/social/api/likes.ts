import api from '../../../api/axios';

export const likeRecipe = (recipeId: string) => api.post(`/likes/${recipeId}`);
export const unlikeRecipe = (recipeId: string) => api.delete(`/likes/${recipeId}`);
export const getLikeStatus = (recipeId: string) => api.get<{ liked: boolean }>(`/likes/${recipeId}/status`);
export const bulkLikeStatus = (recipeIds: string[]) =>
  api.post<{ likedMap: Record<string, boolean> }>('/likes/bulk-status', { recipeIds });
