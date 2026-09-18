import apiClient from './api';
import { ActivityLog } from '../types';

export const activityService = {
  listActivity: async (params?: {
    resource_type?: string;
    resource_id?: number;
    skip?: number;
    limit?: number;
  }): Promise<ActivityLog[]> => {
    const response = await apiClient.get<ActivityLog[]>('/activity', { params });
    return response.data;
  },

  downloadAuditPdf: async (resourceType?: string): Promise<Blob> => {
    const response = await apiClient.get('/activity/report/pdf', {
      params: resourceType && resourceType !== 'ALL' ? { resource_type: resourceType } : undefined,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default activityService;

