import api from './api';
export const purchaseService = {
  getAll:             (p?: Record<string, any>) => api.get('/purchase-orders', { params: p }),
  getOne:             (id: string | number) => api.get(`/purchase-orders/${id}`),
  create:             (d: Record<string, any>) => api.post('/purchase-orders', d),
  update:             (id: string | number, d: Record<string, any>) => api.put(`/purchase-orders/${id}`, d),
  updateStatus:       (id: string | number, d: Record<string, any>) => api.put(`/purchase-orders/${id}/status`, d),
  updatePaymentStatus: (id: string | number, d: Record<string, any>) => api.put(`/purchase-orders/${id}/payment`, d),
  remove:             (id: string | number) => api.delete(`/purchase-orders/${id}`),
};
