import api from './api';
export const inventoryService = {
  getAll:          (p?: Record<string, any>) => api.get('/inventory', { params: p }),
  getSiteInventory:(s: string) => api.get(`/inventory/site/${s}`),
  getTransactions: (p?: Record<string, any>) => api.get('/inventory/transactions', { params: p }),
  adjustStock:     (d: Record<string, any>) => api.post('/inventory/adjust', d),
};
