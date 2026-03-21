import apiClient from './apiClient';

export const servicesApi = {
  getAll: () => apiClient.get('/services'),
  getBySlug: (slug: string) => apiClient.get(`/services/${slug}`),
  getById: (id: string) => apiClient.get(`/services/id/${id}`),
  create: (data: any) => apiClient.post('/services/create', data),
  update: (id: string, data: any) => apiClient.put(`/services/update/${id}`, data),
  delete: (id: string) => apiClient.delete(`/services/delete/${id}`),
};
