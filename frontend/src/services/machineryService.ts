import api from './api';
export const machineryService = {
  getAll: (p?: Record<string, any>) => api.get('/machinery', { params: p }),
  getOne: (id: string | number) => api.get(`/machinery/${id}`),
  create: (d: Record<string, any>) => api.post('/machinery', d),
  update: (id: string | number, d: Record<string, any>) => api.put(`/machinery/${id}`, d),
  remove: (id: string | number) => api.delete(`/machinery/${id}`),
};
