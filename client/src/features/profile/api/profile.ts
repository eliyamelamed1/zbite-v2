import api from '../../../api/axios';

import type { User, Recipe } from '../../../types';

/** Fetch a user's profile and their recent recipes. */
export const getProfile = (id: string) =>
  api.get<{ user: User; recipes: Recipe[] }>(`/users/${id}`);

/** Update the current user's profile (bio and/or avatar). */
export const updateProfile = (formData: FormData) =>
  api.put<{ user: User }>('/users/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
