import api from './api';
export const alertService = {
  getAll:        (p?: Record<string, any>) => api.get('/alerts', { params: p }),
  getUnreadCount:() => api.get('/alerts/unread-count'),
  markRead:      (ids: string[]) => api.put('/alerts/mark-read', { ids }),
  markAllRead:   () => api.put('/alerts/mark-read', {}),
  resolve:       (id: string | number) => api.put(`/alerts/${id}/resolve`),
};
