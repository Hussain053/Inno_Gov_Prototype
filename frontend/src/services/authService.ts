import apiClient from './api';
import { TokenResponse, User } from '../types';

export const authService = {
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  registerStartup: async (data: {
    name: string;
    email: string;
    password: string;
    organization?: string;
  }): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', data);
    return response.data;
  },

  registerGovernment: async (data: {
    name: string;
    email: string;
    password: string;
    organization: string;
    department?: string;
    government_service_id: string;
  }): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register/government', data);
    return response.data;
  },

  registerEvaluator: async (data: {
    name: string;
    email: string;
    password: string;
    organization?: string;
    evaluator_service_id: string;
  }): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register/evaluator', data);
    return response.data;
  },
};

export default authService;
