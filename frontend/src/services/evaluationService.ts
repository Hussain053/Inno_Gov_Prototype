import apiClient from './api';
import { Evaluation, EvaluationRecommendation, EvaluationStatus, EvaluationSummary } from '../types';

export interface EvaluationCreateParams {
  pilot_submission_id: number;
  technical_score: number;
  kpi_score: number;
  innovation_score: number;
  feasibility_score: number;
  impact_score: number;
  comments?: string;
  recommendation: EvaluationRecommendation;
}

export interface EvaluationUpdateParams {
  technical_score?: number;
  kpi_score?: number;
  innovation_score?: number;
  feasibility_score?: number;
  impact_score?: number;
  comments?: string;
  recommendation?: EvaluationRecommendation;
}

export const evaluationService = {
  createEvaluation: async (data: EvaluationCreateParams): Promise<Evaluation> => {
    const response = await apiClient.post<Evaluation>('/evaluations', data);
    return response.data;
  },

  updateEvaluation: async (id: number, data: EvaluationUpdateParams): Promise<Evaluation> => {
    const response = await apiClient.put<Evaluation>(`/evaluations/${id}`, data);
    return response.data;
  },

  completeEvaluation: async (id: number): Promise<Evaluation> => {
    const response = await apiClient.post<Evaluation>(`/evaluations/${id}/complete`);
    return response.data;
  },

  listEvaluations: async (params?: {
    submission_id?: number;
    status?: EvaluationStatus;
    skip?: number;
    limit?: number;
  }): Promise<Evaluation[]> => {
    const response = await apiClient.get<Evaluation[]>('/evaluations', { params });
    return response.data;
  },

  getEvaluation: async (id: number): Promise<Evaluation> => {
    const response = await apiClient.get<Evaluation>(`/evaluations/${id}`);
    return response.data;
  },

  getEvaluationsBySubmission: async (submissionId: number): Promise<Evaluation[]> => {
    const response = await apiClient.get<Evaluation[]>(`/evaluations/submission/${submissionId}`);
    return response.data;
  },

  getEvaluationSummary: async (submissionId: number): Promise<EvaluationSummary> => {
    const response = await apiClient.get<EvaluationSummary>(`/evaluations/summary/${submissionId}`);
    return response.data;
  },
};

export default evaluationService;
