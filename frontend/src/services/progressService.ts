import api from './api';
export const progressService = {
  getAll: (p?: Record<string, any>) => api.get('/progress', { params: p }),
  getOne: (id: string | number) => api.get(`/progress/${id}`),
  create: (d: Record<string, any>) => api.post('/progress', d),
  update: (id: string | number, d: Record<string, any>) => api.put(`/progress/${id}`, d),
  remove: (id: string | number) => api.delete(`/progress/${id}`),
};
