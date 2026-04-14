import apiClient from './apiClient';

export const adminProjectsApi = {
  getAll: () => apiClient.get('/admin/projects'),
  getPortfolio: () => apiClient.get('/admin/projects/portfolio'),
  getById: (id: string) => apiClient.get(`/admin/projects/${id}`),
  create: (data: any) => apiClient.post('/admin/projects', data),
  update: (id: string, data: any) => apiClient.put(`/admin/projects/${id}`, data),
  updateStatus: (id: string, status: string) => apiClient.patch(`/admin/projects/${id}/status`, { status }),
  delete: (id: string) => apiClient.delete(`/admin/projects/${id}`),
  bulkDelete: (ids: string[]) => apiClient.delete('/admin/projects/bulk', { data: { ids } }),
  bulkToggleVisibility: (ids: string[], isPublic: boolean) => apiClient.patch('/admin/projects/bulk/visibility', { ids, isPublic }),
  toggleFeaturedHome: (id: string) => apiClient.patch(`/admin/projects/${id}/featured-home`),
};
