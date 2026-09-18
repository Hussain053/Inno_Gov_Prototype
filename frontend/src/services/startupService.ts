import apiClient from './api';
import { StartupProfile } from '../types';

export interface StartupProfileUpdateParams {
  company_name?: string;
  description?: string;
  industry?: string;
  location?: string;
  website?: string;
  team_size?: number;
  experience?: string;
  kpi_data?: Record<string, any>;
}

export const startupService = {
  getMyProfile: async (): Promise<StartupProfile | null> => {
    try {
      const response = await apiClient.get<StartupProfile>('/startups/me');
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  updateMyProfile: async (data: StartupProfileUpdateParams): Promise<StartupProfile> => {
    const response = await apiClient.put<StartupProfile>('/startups/me', data);
    return response.data;
  },

  getProfileById: async (id: number): Promise<StartupProfile> => {
    const response = await apiClient.get<StartupProfile>(`/startups/${id}`);
    return response.data;
  },

  getStartupProfile: async (id: number): Promise<StartupProfile> => {
    const response = await apiClient.get<StartupProfile>(`/startups/${id}`);
    return response.data;
  },
};

export default startupService;
