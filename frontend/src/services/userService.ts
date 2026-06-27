import api from './api';
export const userService = {
  getAll:         (p?: Record<string, any>) => api.get('/users', { params: p }),
  create:         (d: Record<string, any>) => api.post('/users', d),
  update:         (id: string | number, d: Record<string, any>) => api.put(`/users/${id}`, d),
  resetPassword:  (id: string | number, d: Record<string, any>) => api.put(`/users/${id}/reset-password`, d),
  updateProfile:  (d: Record<string, any>) => api.put('/auth/profile', d),
  changePassword: (d: Record<string, any>) => api.put('/auth/password', d),
};
