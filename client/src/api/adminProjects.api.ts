import apiClient from './apiClient';

export const adminProjectsApi = {
  getAll: () => apiClient.get('/admin/projects'),
  getPortfolio: (bust = false) => apiClient.get(`/admin/projects/portfolio${bust ? `?_nc=${Date.now()}` : ''}`),
  // _nc = no-cache buster; prevents any browser-level caching on top of the no-store header
  getHomeFeatured: () => apiClient.get(`/admin/projects/home-featured?_nc=${Date.now()}`),
  getById: (id: string) => apiClient.get(`/admin/projects/${id}`),
  getPublicById: (id: string) => apiClient.get(`/admin/projects/public/${id}`),
  create: (data: any) => apiClient.post('/admin/projects', data),
  update: (id: string, data: any) => apiClient.put(`/admin/projects/${id}`, data),
  updateStatus: (id: string, status: string) => apiClient.patch(`/admin/projects/${id}/status`, { status }),
  delete: (id: string) => apiClient.delete(`/admin/projects/${id}`),
  bulkDelete: (ids: string[]) => apiClient.delete('/admin/projects/bulk', { data: { ids } }),
  bulkToggleVisibility: (ids: string[], isPublic: boolean) => apiClient.patch('/admin/projects/bulk/visibility', { ids, isPublic }),
  toggleFeaturedHome: (id: string) => apiClient.patch(`/admin/projects/${id}/featured-home`),
  uploadImages: (id: string, files: File[]) => {
    const fd = new FormData();
    files.forEach(f => fd.append('images', f));
    return apiClient.post(`/admin/projects/${id}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deleteGalleryImage: (id: string, imageId: string) => apiClient.delete(`/admin/projects/${id}/images/${imageId}`),
};
