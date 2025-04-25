// import { mockUsers } from '../utils/mockData';
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { AUTH_END_POINTS } from '../utils/constants';

export type UserRole = 'admin' | 'attorney' | 'paralegal' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  registerUser: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  getUserProfile: (email: string, password: string) => Promise<void>;
  updateUserProfile: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isAttorney: boolean;
  isParalegal: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing user session
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const registerUser = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {

      const response = await api.post(AUTH_END_POINTS.LOGIN, { email, password });
  
      const user = response.data;
  
      // Simulating API call with timeout
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          
          if (user && user.token) { // In a real app, use proper password verification
            setUser(user);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', user.token);
            setIsLoading(false);
            resolve();
          } else {
            setIsLoading(false);
            reject(new Error('Invalid email or password'));
          }
        }, 1000);
      });
  
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {

      const response = await api.post(AUTH_END_POINTS.LOGIN, { email, password });
  
      const user = response.data;
  
      // Simulating API call with timeout
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          
          if (user && user.token) { // In a real app, use proper password verification
            setUser(user);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', user.token);
            setIsLoading(false);
            resolve();
          } else {
            setIsLoading(false);
            reject(new Error('Invalid email or password'));
          }
        }, 1000);
      });
  
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserProfile = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {

      const response = await api.post(AUTH_END_POINTS.LOGIN, { email, password });
  
      const user = response.data;
  
      // Simulating API call with timeout
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          
          if (user && user.token) { // In a real app, use proper password verification
            setUser(user);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', user.token);
            setIsLoading(false);
            resolve();
          } else {
            setIsLoading(false);
            reject(new Error('Invalid email or password'));
          }
        }, 1000);
      });
  
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {

      const response = await api.post(AUTH_END_POINTS.LOGIN, { email, password });
  
      const user = response.data;
  
      // Simulating API call with timeout
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          
          if (user && user.token) { // In a real app, use proper password verification
            setUser(user);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', user.token);
            setIsLoading(false);
            resolve();
          } else {
            setIsLoading(false);
            reject(new Error('Invalid email or password'));
          }
        }, 1000);
      });
  
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const isAdmin = user?.role === 'admin';
  const isAttorney = user?.role === 'attorney' || isAdmin;
  const isParalegal = user?.role === 'paralegal' || isAttorney;
  const isClient = user?.role === 'client';

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading,
      registerUser,
      login,
      getUserProfile,
      updateUserProfile,
      logout,
      isAdmin,
      isAttorney,
      isParalegal,
      isClient
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};