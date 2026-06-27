import api from './api';
export const enquiryService = {
  getAll: (p?: Record<string, any>) => api.get('/enquiries', { params: p }),
  getOne: (id: string | number) => api.get(`/enquiries/${id}`),
  create: (d: Record<string, any>) => api.post('/enquiries', d),
  update: (id: string | number, d: Record<string, any>) => api.put(`/enquiries/${id}`, d),
  remove: (id: string | number) => api.delete(`/enquiries/${id}`),
};
