import Cookies from 'js-cookie';
import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'shop_admin';
  shop?: any;
}

export const login = async (email: string, password: string, role: string) => {
  const response = await api.post('/auth/login', { email, password, role });
  const { token, ...userData } = response.data;
  
  Cookies.set('token', token, { expires: 7 });
  Cookies.set('role', userData.role, { expires: 7 });
  Cookies.set('user', JSON.stringify(userData), { expires: 7 });
  
  return userData;
};

export const logout = () => {
  Cookies.remove('token');
  Cookies.remove('role');
  Cookies.remove('user');
  window.location.href = '/login';
};

export const getCurrentUser = (): User | null => {
  const userStr = Cookies.get('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return !!Cookies.get('token');
};

export const getRole = (): string | null => {
  return Cookies.get('role') || null;
};
