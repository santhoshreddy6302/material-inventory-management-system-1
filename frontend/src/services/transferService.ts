import api from './api';
export const transferService = {
  getAll:       (p?: Record<string, any>) => api.get('/transfers', { params: p }),
  create:       (d: Record<string, any>) => api.post('/transfers', d),
  updateStatus: (id: string | number, d: Record<string, any>) => api.put(`/transfers/${id}/status`, d),
};
