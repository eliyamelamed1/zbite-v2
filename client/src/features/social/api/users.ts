import api from '../../../api/axios';
import { User, PaginatedResponse } from '../../../types';

export const searchUsers = (q: string, page = 1) =>
  api.get<PaginatedResponse<User>>(`/users/search?q=${encodeURIComponent(q)}&page=${page}`);

export const getSuggestedUsers = () =>
  api.get<{ data: User[] }>('/users/suggested');

export const followUser = (userId: string) => api.post(`/follows/${userId}`);
export const unfollowUser = (userId: string) => api.delete(`/follows/${userId}`);
export const getFollowStatus = (userId: string) => api.get<{ following: boolean }>(`/follows/${userId}/status`);
export const getFollowers = (userId: string, page = 1) => api.get<PaginatedResponse<User>>(`/follows/${userId}/followers?page=${page}`);
export const getFollowing = (userId: string, page = 1) => api.get<PaginatedResponse<User>>(`/follows/${userId}/following?page=${page}`);
