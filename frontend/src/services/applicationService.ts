import apiClient from './api';
import { Application, ApplicationStatus } from '../types';

export const applicationService = {
  createApplication: async (challengeId: number): Promise<Application> => {
    const response = await apiClient.post<Application>('/applications', {
      challenge_id: challengeId,
    });
    return response.data;
  },

  listApplications: async (params?: {
    challenge_id?: number;
    status?: ApplicationStatus;
    skip?: number;
    limit?: number;
  }): Promise<Application[]> => {
    const response = await apiClient.get<Application[]>('/applications', { params });
    return response.data;
  },

  getApplication: async (id: number): Promise<Application> => {
    const response = await apiClient.get<Application>(`/applications/${id}`);
    return response.data;
  },

  submitApplication: async (id: number): Promise<Application> => {
    const response = await apiClient.post<Application>(`/applications/${id}/submit`);
    return response.data;
  },

  withdrawApplication: async (id: number): Promise<Application> => {
    const response = await apiClient.post<Application>(`/applications/${id}/withdraw`);
    return response.data;
  },

  updateStatus: async (id: number, status: ApplicationStatus): Promise<Application> => {
    const response = await apiClient.patch<Application>(`/applications/${id}/status`, {
      status,
    });
    return response.data;
  },

  // Smart shortlisting helper: transitions SUBMITTED -> UNDER_REVIEW -> SHORTLISTED if needed
  shortlistApplication: async (id: number, currentStatus?: ApplicationStatus): Promise<Application> => {
    if (currentStatus === 'SUBMITTED') {
      await apiClient.patch<Application>(`/applications/${id}/status`, {
        status: 'UNDER_REVIEW',
      });
    }
    const response = await apiClient.patch<Application>(`/applications/${id}/status`, {
      status: 'SHORTLISTED',
    });
    return response.data;
  },

  rejectApplication: async (id: number, currentStatus?: ApplicationStatus): Promise<Application> => {
    if (currentStatus === 'SUBMITTED') {
      await apiClient.patch<Application>(`/applications/${id}/status`, {
        status: 'UNDER_REVIEW',
      });
    }
    const response = await apiClient.patch<Application>(`/applications/${id}/status`, {
      status: 'REJECTED',
    });
    return response.data;
  },

  respondToInvite: async (applicationId: number, action: 'ACCEPT' | 'REJECT'): Promise<Application> => {
    const response = await apiClient.post<Application>(`/applications/${applicationId}/respond-invite`, {
      action,
    });
    return response.data;
  },
};

export default applicationService;

