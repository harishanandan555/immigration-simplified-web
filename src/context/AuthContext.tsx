import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockUsers } from '../utils/mockData';

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
  login: (email: string, password: string) => Promise<void>;
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

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    // Simulating API call with timeout
    return new Promise((resolve, reject) => {
      setTimeout(() => {

        const foundUser: any = mockUsers.find(user => user.email === email);
        
        if (foundUser && password === 'password') { // In a real app, use proper password verification
          setUser(foundUser);
          localStorage.setItem('user', JSON.stringify(foundUser));
          setIsLoading(false);
          resolve();
        } else {
          setIsLoading(false);
          reject(new Error('Invalid email or password'));
        }
      }, 1000);
    });
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
      login,
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