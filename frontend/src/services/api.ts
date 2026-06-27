import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';

// Ensure the base URL always ends with /api so that routes like
// /auth/login always resolve to /api/auth/login regardless of
// how VITE_API_URL is configured in Vercel or other platforms.
const rawBase: string = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';
const baseURL = rawBase.replace(/\/+$/, '').endsWith('/api')
  ? rawBase.replace(/\/+$/, '')
  : rawBase.replace(/\/+$/, '') + '/api';

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

const token = localStorage.getItem('mims_token');
if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (err: any) => Promise.reject(err)
);

const camelToSnake = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => camelToSnake(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      result[snakeKey] = camelToSnake(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.data) {
      response.data = camelToSnake(response.data);
    }
    return response;
  },
  (error: AxiosError<any>) => {
    const data = error.response?.data as { message?: string } | undefined;
    const msg = data?.message || error.message || 'Request failed';
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem('mims_token');
      delete api.defaults.headers.common['Authorization'];
      if (window.location.pathname !== '/login') window.location.href = '/login';
    } else if (status === 403) {
      toast.error('Access denied. Insufficient permissions.');
    } else if (status && status >= 500) {
      toast.error('Server error. Please try again.');
    }
    return Promise.reject({ ...error, message: msg });
  }
);

export default api;
