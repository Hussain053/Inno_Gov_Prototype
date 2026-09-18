import apiClient from './api';
import { Challenge, ChallengeStatus } from '../types';

export interface ChallengeCreateParams {
  title: string;
  description: string;
  problem_statement: string;
  category?: string;
  location?: string;
  budget?: number;
  application_deadline?: string;
  status?: ChallengeStatus;
  requirements?: Record<string, any>;
  kpis?: Record<string, any>;
}

export interface ChallengeUpdateParams {
  title?: string;
  description?: string;
  problem_statement?: string;
  category?: string;
  location?: string;
  budget?: number;
  application_deadline?: string;
  status?: ChallengeStatus;
  requirements?: Record<string, any>;
  kpis?: Record<string, any>;
}

export const challengeService = {
  listChallenges: async (params?: {
    status?: ChallengeStatus;
    category?: string;
    government_user_id?: number;
    skip?: number;
    limit?: number;
  }): Promise<Challenge[]> => {
    const response = await apiClient.get<Challenge[]>('/challenges', { params });
    return response.data;
  },

  getChallenge: async (id: number): Promise<Challenge> => {
    const response = await apiClient.get<Challenge>(`/challenges/${id}`);
    return response.data;
  },

  createChallenge: async (data: ChallengeCreateParams): Promise<Challenge> => {
    const response = await apiClient.post<Challenge>('/challenges', data);
    return response.data;
  },

  updateChallenge: async (id: number, data: ChallengeUpdateParams): Promise<Challenge> => {
    const response = await apiClient.put<Challenge>(`/challenges/${id}`, data);
    return response.data;
  },

  publishChallenge: async (id: number): Promise<Challenge> => {
    const response = await apiClient.put<Challenge>(`/challenges/${id}`, { status: 'OPEN' });
    return response.data;
  },

  makeDecision: async (
    challengeId: number,
    data: { pilot_id: number; decision: 'AWARDED' | 'REJECTED'; notes?: string }
  ): Promise<any> => {
    const response = await apiClient.post(`/challenges/${challengeId}/decision`, data);
    return response.data;
  },

  deleteChallenge: async (id: number): Promise<void> => {
    await apiClient.delete(`/challenges/${id}`);
  },

  listEvaluators: async (): Promise<Array<{ id: number; name: string; email: string; organization?: string }>> => {
    const response = await apiClient.get('/challenges/evaluators/list');
    return response.data;
  },

  assignEvaluator: async (challengeId: number, evaluatorId: number): Promise<Challenge> => {
    const response = await apiClient.post<Challenge>(`/challenges/${challengeId}/assign-evaluator`, {
      evaluator_id: evaluatorId,
    });
    return response.data;
  },

  inviteStartup: async (challengeId: number, startupId: number): Promise<any> => {
    const response = await apiClient.post(`/challenges/${challengeId}/invite`, {
      startup_id: startupId,
    });
    return response.data;
  },

  downloadTenderPdf: async (challengeId: number): Promise<Blob> => {
    const response = await apiClient.get(`/challenges/${challengeId}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default challengeService;

