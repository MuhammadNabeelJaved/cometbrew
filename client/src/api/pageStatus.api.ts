import apiClient from './apiClient';
import { apiCache } from '../lib/apiCache';

export interface PageStatusItem {
  _id?: string;
  key: string;
  label: string;
  path: string;
  matchPrefix: boolean;
  status: 'active' | 'maintenance' | 'coming-soon';
  category?: 'public' | 'admin' | 'user' | 'team';
  isCustom?: boolean;
  isHidden?: boolean;
  updatedAt?: string;
}

export interface CreatePagePayload {
  label: string;
  path: string;
  matchPrefix: boolean;
  status: 'active' | 'maintenance' | 'coming-soon';
}

export const pageStatusApi = {
  getAll: () => apiClient.get<{ success: boolean; data: PageStatusItem[] }>('/page-status'),
  update: async (key: string, status: string) => {
    const res = await apiClient.put(`/page-status/${key}`, { status });
    apiCache.invalidate('page-status:');
    return res;
  },
  toggleVisibility: async (key: string, isHidden: boolean) => {
    const res = await apiClient.put(`/page-status/${key}`, { isHidden });
    apiCache.invalidate('page-status:');
    return res;
  },
  create: async (data: CreatePagePayload) => {
    const res = await apiClient.post('/page-status', data);
    apiCache.invalidate('page-status:');
    return res;
  },
  delete: async (key: string) => {
    const res = await apiClient.delete(`/page-status/${key}`);
    apiCache.invalidate('page-status:');
    return res;
  },
};
