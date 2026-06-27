import api from './api';
export const labourService = {
  getAll: (p?: Record<string, any>) => api.get('/labour', { params: p }),
  getOne: (id: string | number) => api.get(`/labour/${id}`),
  create: (d: Record<string, any>) => api.post('/labour', d),
  update: (id: string | number, d: Record<string, any>) => api.put(`/labour/${id}`, d),
  remove: (id: string | number) => api.delete(`/labour/${id}`),
};
