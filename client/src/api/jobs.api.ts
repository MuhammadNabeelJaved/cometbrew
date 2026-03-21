import apiClient from './apiClient';

export const jobsApi = {
  getAll: () => apiClient.get('/jobs'),
  getActive: () => apiClient.get('/jobs/active'),
  getById: (id: string) => apiClient.get(`/jobs/${id}`),
  create: (data: any) => apiClient.post('/jobs', data),
  update: (id: string, data: any) => apiClient.put(`/jobs/${id}`, data),
  updateStatus: (id: string, status: string) => apiClient.patch(`/jobs/${id}/status`, { status }),
  delete: (id: string) => apiClient.delete(`/jobs/${id}`),
};
