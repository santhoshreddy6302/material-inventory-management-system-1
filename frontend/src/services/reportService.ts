import api from './api';
export const reportService = {
  getInventory: (p?: Record<string, any>) => api.get('/reports/inventory', { params: p }),
  getPurchase:  (p?: Record<string, any>) => api.get('/reports/purchase', { params: p }),
  getUsage:     (p?: Record<string, any>) => api.get('/reports/usage', { params: p }),
  getWastage:   (p?: Record<string, any>) => api.get('/reports/wastage', { params: p }),
  getLogs:      (p?: Record<string, any>) => api.get('/reports/activity-logs', { params: p }),
  download: (type: string, params?: Record<string, any>) => api.get(`/reports/${type}`, {
    params, responseType: 'blob'
  }),
};
