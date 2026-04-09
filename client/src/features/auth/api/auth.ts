import api from '../../../api/axios';
import { User } from '../../../types';

interface AuthResponse {
  token: string;
  user: User;
  isNewUser?: boolean;
}

export const register = (data: { username: string; email: string; password: string }) =>
  api.post<AuthResponse>('/auth/register', data);

export const login = (data: { email: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', data);

export const getMe = () => api.get<{ user: User }>('/auth/me');

export const saveInterests = (interests: string[]) =>
  api.put<{ user: User }>('/auth/interests', { interests });
