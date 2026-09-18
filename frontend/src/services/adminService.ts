import apiClient from './api';
import { User, UserRole } from '../types';

export const adminService = {
  listUsers: async (params?: {
    role?: UserRole;
    is_active?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/admin/users', { params });
    return response.data;
  },

  getUserDetail: async (userId: number): Promise<User> => {
    const response = await apiClient.get<User>(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (userId: number, isActive: boolean): Promise<User> => {
    const response = await apiClient.patch<User>(`/admin/users/${userId}/status`, {
      is_active: isActive,
    });
    return response.data;
  },

  updateUserRole: async (userId: number, role: UserRole): Promise<User> => {
    const response = await apiClient.patch<User>(`/admin/users/${userId}/role`, {
      role,
    });
    return response.data;
  },
};

export default adminService;
