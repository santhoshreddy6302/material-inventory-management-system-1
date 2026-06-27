import api from './api';
export const expenseService = {
  getAll: (p?: Record<string, any>) => api.get('/expenses', { params: p }),
  getOne: (id: string | number) => api.get(`/expenses/${id}`),
  create: (d: Record<string, any>) => api.post('/expenses', d),
  update: (id: string | number, d: Record<string, any>) => api.put(`/expenses/${id}`, d),
  remove: (id: string | number) => api.delete(`/expenses/${id}`),
};
