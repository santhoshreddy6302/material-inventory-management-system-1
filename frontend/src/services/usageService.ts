import api from './api';
export const usageService = {
  getAll:   (p?: Record<string, any>) => api.get('/usage', { params: p }),
  create:   (d: Record<string, any>) => api.post('/usage', d),
  getStats: (p?: Record<string, any>) => api.get('/usage/stats', { params: p }),
};
