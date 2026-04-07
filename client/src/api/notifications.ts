import api from './axios';
import { Notification, PaginatedResponse } from '../types';

export const getNotifications = (page = 1) =>
  api.get<PaginatedResponse<Notification>>(`/notifications?page=${page}`);

export const getUnreadCount = () =>
  api.get<{ count: number }>('/notifications/unread-count');

export const markNotificationsRead = (ids?: string[]) =>
  api.put('/notifications/read', { ids });
