import api from './api';
export const projectService = {
  getAll:  (p?: Record<string, any>) => api.get('/projects', { params: p }),
  getOne:  (id: string | number) => api.get(`/projects/${id}`),
  create:  (d: Record<string, any>) => api.post('/projects', d),
  update:  (id: string | number, d: Record<string, any>) => api.put(`/projects/${id}`, d),
  remove:  (id: string | number) => api.delete(`/projects/${id}`),
};
