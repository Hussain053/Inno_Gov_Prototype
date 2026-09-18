import apiClient from './api';
import { Contract, ContractStatus } from '../types';

export interface ContractCreateParams {
  pilot_id: number;
  contract_value?: number;
  start_date?: string;
  end_date?: string;
  status?: ContractStatus;
}

export interface ContractUpdateParams {
  contract_value?: number;
  start_date?: string;
  end_date?: string;
}

export const contractService = {
  createContract: async (data: ContractCreateParams): Promise<Contract> => {
    const response = await apiClient.post<Contract>('/contracts', data);
    return response.data;
  },

  listContracts: async (params?: {
    challenge_id?: number;
    startup_id?: number;
    pilot_id?: number;
    status?: ContractStatus;
    skip?: number;
    limit?: number;
  }): Promise<Contract[]> => {
    const response = await apiClient.get<Contract[]>('/contracts', { params });
    return response.data;
  },

  getContract: async (id: number): Promise<Contract> => {
    const response = await apiClient.get<Contract>(`/contracts/${id}`);
    return response.data;
  },

  updateContract: async (id: number, data: ContractUpdateParams): Promise<Contract> => {
    const response = await apiClient.put<Contract>(`/contracts/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: number, status: ContractStatus): Promise<Contract> => {
    const response = await apiClient.patch<Contract>(`/contracts/${id}/status`, { status });
    return response.data;
  },
};

export default contractService;
