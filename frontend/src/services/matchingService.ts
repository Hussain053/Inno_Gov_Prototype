import apiClient from './api';
import { MatchResponse } from '../types';

export const matchingService = {
  matchStartupToChallenge: async (challengeId: number): Promise<MatchResponse> => {
    const response = await apiClient.get<MatchResponse>(`/matching/challenges/${challengeId}`);
    return response.data;
  },

  matchAllStartupsForChallenge: async (challengeId: number): Promise<MatchResponse[]> => {
    const response = await apiClient.get<MatchResponse[]>(`/matching/challenges/${challengeId}/startups`);
    return response.data;
  },
};

export default matchingService;
