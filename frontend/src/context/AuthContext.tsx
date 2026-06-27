import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (...roles: string[]) => boolean;
  isAdmin: () => boolean;
  fetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [token,   setToken]   = useState<string | null>(() => localStorage.getItem('mims_token'));

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.success) setUser(data.data);
      else logout();
    } catch { logout(); }
    finally { setLoading(false); }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.success) {
        const { token: tk, user: u } = data.data;
        localStorage.setItem('mims_token', tk);
        api.defaults.headers.common['Authorization'] = `Bearer ${tk}`;
        setToken(tk);
        setUser(u);
        toast.success(`Welcome back, ${u.name}!`);
        return true;
      }
      return false;
    } catch (e: any) {
      const msg = e?.message || e?.response?.data?.message || 'Login failed. Please check your connection.';
      toast.error(msg);
      return false;
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('mims_token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  }, []);

  const hasRole = (...roles: string[]) => !!user && !!user.role && roles.includes(user.role);
  const isAdmin = () => user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, isAdmin, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
