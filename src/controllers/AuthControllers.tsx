// import { mockUsers } from '../utils/mockData';
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { AUTH_END_POINTS } from '../utils/constants';

export type UserRole = 'admin' | 'attorney' | 'paralegal' | 'client' | 'superadmin';

export interface User {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  registerUser: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  getUserProfile: (email: string, password: string) => Promise<void>;
  updateUserProfile: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAttorney: boolean;
  isParalegal: boolean;
  isClient: boolean;
  isSuperAdmin: boolean;
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
      const response = await api.post(AUTH_END_POINTS.REGISTER, { email, password });
      if (response.data.success) {
        setUser(response.data.data);
        localStorage.setItem('user', JSON.stringify(response.data.data));
        localStorage.setItem('token', response.data.data.token);
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('Attempting login with:', { email, password });
      console.log('API URL:', AUTH_END_POINTS.LOGIN);
      
      const response = await api.post(AUTH_END_POINTS.LOGIN, { email, password });
      console.log('Login response:', response);
      
      // Check if we have user data directly
      if (response.data && response.data._id) {
        const userData = response.data;
        console.log('Login successful, user data:', userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userData.token);
      } else {
        console.error('Login failed: Invalid response format');
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response) {
        console.error('Error response:', error.response);
        throw new Error(error.response.data.message || 'Login failed');
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw new Error('Unable to connect to the server. Please check your internet connection.');
      } else {
        console.error('Request setup error:', error.message);
        throw new Error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getUserProfile = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await api.get(AUTH_END_POINTS.PROFILE_GET, { params: { email, password } });
      if (response.data.success) {
        setUser(response.data.data);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      } else {
        throw new Error(response.data.message || 'Failed to get user profile');
      }
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to get user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await api.put(AUTH_END_POINTS.PROFILE_PUT, { email, password });
      if (response.data.success) {
        setUser(response.data.data);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      } else {
        throw new Error(response.data.message || 'Failed to update user profile');
      }
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Failed to update user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const isSuperAdmin = user?.role === 'superadmin';
  const isAttorney = user?.role === 'attorney';
  const isParalegal = user?.role === 'paralegal';
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
      isAttorney,
      isParalegal,
      isClient,
      isSuperAdmin
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