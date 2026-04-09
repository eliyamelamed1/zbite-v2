import api from '../../../api/axios';
import { Comment, PaginatedResponse } from '../../../types';

export const getComments = (recipeId: string, page = 1) =>
  api.get<PaginatedResponse<Comment>>(`/comments/${recipeId}?page=${page}`);

export const createComment = (recipeId: string, text: string) =>
  api.post<{ comment: Comment }>(`/comments/${recipeId}`, { text });
