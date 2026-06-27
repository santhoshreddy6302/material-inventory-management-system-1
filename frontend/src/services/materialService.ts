import api from './api';
export const materialService = {
  getAll:          (p?: Record<string, any>) => api.get('/materials', { params: p }),
  getOne:          (id: string | number) => api.get(`/materials/${id}`),
  create:          (d: Record<string, any>) => api.post('/materials', d),
  update:          (id: string | number, d: Record<string, any>) => api.put(`/materials/${id}`, d),
  remove:          (id: string | number) => api.delete(`/materials/${id}`),
  getLowStock:     () => api.get('/materials/low-stock'),
  getCategories:   () => api.get('/materials/categories'),
  createCategory:  (d: Record<string, any>) => api.post('/materials/categories', d),
};
