import api from './api';
export const wastageService = {
  getAll:   (p?: Record<string, any>) => api.get('/wastage', { params: p }),
  create:   (d: Record<string, any>) => api.post('/wastage', d),
  getStats: (p?: Record<string, any>) => api.get('/wastage/stats', { params: p }),
};
