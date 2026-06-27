import api from './api';
export const siteService = {
  getAll:      (p?: Record<string, any>) => api.get('/sites', { params: p }),
  getAllSimple: () => api.get('/sites/all'),
  create:      (d: Record<string, any>) => api.post('/sites', d),
  update:      (id: string | number, d: Record<string, any>) => api.put(`/sites/${id}`, d),
  remove:      (id: string | number) => api.delete(`/sites/${id}`),
};
