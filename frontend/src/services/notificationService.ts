import apiClient from './api';
import { Notification } from '../types';

export const notificationService = {
  listNotifications: async (skip: number = 0, limit: number = 50): Promise<Notification[]> => {
    const response = await apiClient.get<Notification[]>('/notifications', {
      params: { skip, limit },
    });
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ unread_count: number }>('/notifications/unread/count');
    return response.data.unread_count;
  },

  listUnread: async (skip: number = 0, limit: number = 50): Promise<Notification[]> => {
    const response = await apiClient.get<Notification[]>('/notifications/unread', {
      params: { skip, limit },
    });
    return response.data;
  },

  markRead: async (notificationId: number): Promise<Notification> => {
    const response = await apiClient.patch<Notification>(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },
};

export default notificationService;
