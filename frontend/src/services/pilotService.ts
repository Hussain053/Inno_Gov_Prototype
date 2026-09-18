import apiClient from './api';
import { Pilot, PilotStatus } from '../types';

export interface PilotCreateParams {
  application_id: number;
  title: string;
  task_description: string;
  requirements?: Record<string, any>;
  success_criteria?: Record<string, any>;
  kpis?: Record<string, any>;
  start_date?: string;
  end_date?: string;
  status?: PilotStatus;
}

export interface PilotUpdateParams {
  title?: string;
  task_description?: string;
  requirements?: Record<string, any>;
  success_criteria?: Record<string, any>;
  kpis?: Record<string, any>;
  start_date?: string;
  end_date?: string;
  status?: PilotStatus;
}

export const pilotService = {
  createPilot: async (data: PilotCreateParams): Promise<Pilot> => {
    const response = await apiClient.post<Pilot>('/pilots', data);
    return response.data;
  },

  listPilots: async (params?: {
    challenge_id?: number;
    startup_id?: number;
    status?: PilotStatus;
    skip?: number;
    limit?: number;
  }): Promise<Pilot[]> => {
    const response = await apiClient.get<Pilot[]>('/pilots', { params });
    return response.data;
  },

  getPilot: async (id: number): Promise<Pilot> => {
    const response = await apiClient.get<Pilot>(`/pilots/${id}`);
    return response.data;
  },

  updatePilot: async (id: number, data: PilotUpdateParams): Promise<Pilot> => {
    const response = await apiClient.put<Pilot>(`/pilots/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: number, status: PilotStatus): Promise<Pilot> => {
    const response = await apiClient.patch<Pilot>(`/pilots/${id}/status`, { status });
    return response.data;
  },

  startPilot: async (id: number): Promise<Pilot> => {
    const response = await apiClient.patch<Pilot>(`/pilots/${id}/status`, { status: 'IN_PROGRESS' });
    return response.data;
  },

  completePilot: async (id: number): Promise<Pilot> => {
    const response = await apiClient.patch<Pilot>(`/pilots/${id}/status`, { status: 'COMPLETED' });
    return response.data;
  },

  failPilot: async (id: number): Promise<Pilot> => {
    const response = await apiClient.patch<Pilot>(`/pilots/${id}/status`, { status: 'FAILED' });
    return response.data;
  },

  deletePilot: async (id: number): Promise<void> => {
    await apiClient.delete(`/pilots/${id}`);
  },
};

export default pilotService;
