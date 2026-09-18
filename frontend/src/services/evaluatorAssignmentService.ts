import apiClient from './api';
import { AssignmentStatus, EvaluatorAssignment } from '../types';

export const evaluatorAssignmentService = {
  createAssignment: async (data: {
    pilot_submission_id: number;
    evaluator_id: number;
  }): Promise<EvaluatorAssignment> => {
    const response = await apiClient.post<EvaluatorAssignment>('/evaluator-assignments', data);
    return response.data;
  },

  listAssignments: async (): Promise<EvaluatorAssignment[]> => {
    const response = await apiClient.get<EvaluatorAssignment[]>('/evaluator-assignments');
    return response.data;
  },

  getAssignment: async (id: number): Promise<EvaluatorAssignment> => {
    const response = await apiClient.get<EvaluatorAssignment>(`/evaluator-assignments/${id}`);
    return response.data;
  },

  updateStatus: async (id: number, status: AssignmentStatus): Promise<EvaluatorAssignment> => {
    const response = await apiClient.patch<EvaluatorAssignment>(`/evaluator-assignments/${id}/status`, {
      status,
    });
    return response.data;
  },

  listEvaluators: async (): Promise<Array<{ id: number; name: string; email: string; organization?: string }>> => {
    const response = await apiClient.get('/evaluator-assignments/evaluators');
    return response.data;
  },
};

export default evaluatorAssignmentService;

