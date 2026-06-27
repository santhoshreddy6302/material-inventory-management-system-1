import api from './api';
export const subcontractorService = {
  getAll: (p?: Record<string, any>) => api.get('/subcontractors', { params: p }),
  getOne: (id: string | number) => api.get(`/subcontractors/${id}`),
  create: (d: Record<string, any>) => api.post('/subcontractors', d),
  update: (id: string | number, d: Record<string, any>) => api.put(`/subcontractors/${id}`, d),
  remove: (id: string | number) => api.delete(`/subcontractors/${id}`),
};
