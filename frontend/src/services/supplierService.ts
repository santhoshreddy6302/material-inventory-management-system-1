import api from './api';
export const supplierService = {
  getAll:      (p?: Record<string, any>) => api.get('/suppliers', { params: p }),
  getAllSimple: () => api.get('/suppliers/all'),
  create:      (d: Record<string, any>) => api.post('/suppliers', d),
  update:      (id: string | number, d: Record<string, any>) => api.put(`/suppliers/${id}`, d),
  remove:      (id: string | number) => api.delete(`/suppliers/${id}`),
};
