import api from './api';
export const dashboardService = {
  getStats:          () => api.get('/dashboard/stats'),
  getInventoryTrend: () => api.get('/dashboard/inventory-trend'),
  getUsageByCategory:() => api.get('/dashboard/usage-by-category'),
  getWastageAnalysis:() => api.get('/dashboard/wastage-analysis'),
  getSiteConsumption:() => api.get('/dashboard/site-consumption'),
  getMonthlyTrend:   () => api.get('/dashboard/monthly-trend'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
  getLowStockItems:  () => api.get('/dashboard/low-stock'),
};
