import apiClient from './apiClient';

export const clientsApi = {
  getAll: () => apiClient.get('/clients'),
  getById: (id: string) => apiClient.get(`/clients/${id}`),
  create: (data: any) => apiClient.post('/clients', data),
  update: (id: string, data: any) => apiClient.put(`/clients/${id}`, data),
  delete: (id: string) => apiClient.delete(`/clients/${id}`),
  getStats: () => apiClient.get('/clients/stats'),
};
