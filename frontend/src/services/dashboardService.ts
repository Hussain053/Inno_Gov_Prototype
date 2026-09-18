import apiClient from './api';
import {
  AdminDashboardResponse,
  EvaluatorDashboardResponse,
  GovernmentDashboardResponse,
  StartupDashboardResponse,
} from '../types';

export const dashboardService = {
  getStartupDashboard: async (): Promise<StartupDashboardResponse> => {
    const response = await apiClient.get<StartupDashboardResponse>('/dashboard/startup');
    return response.data;
  },

  getGovernmentDashboard: async (): Promise<GovernmentDashboardResponse> => {
    const response = await apiClient.get<GovernmentDashboardResponse>('/dashboard/government');
    return response.data;
  },

  getEvaluatorDashboard: async (): Promise<EvaluatorDashboardResponse> => {
    const response = await apiClient.get<EvaluatorDashboardResponse>('/dashboard/evaluator');
    return response.data;
  },

  getAdminDashboard: async (): Promise<AdminDashboardResponse> => {
    const response = await apiClient.get<AdminDashboardResponse>('/dashboard/admin');
    return response.data;
  },
};

export default dashboardService;
