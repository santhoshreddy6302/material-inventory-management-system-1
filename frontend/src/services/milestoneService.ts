import api from './api';
export const milestoneService = {
  getAll: (p?: Record<string, any>) => api.get('/milestones', { params: p }),
  getOne: (id: string | number) => api.get(`/milestones/${id}`),
  create: (d: Record<string, any>) => api.post('/milestones', d),
  update: (id: string | number, d: Record<string, any>) => api.put(`/milestones/${id}`, d),
  remove: (id: string | number) => api.delete(`/milestones/${id}`),
};
