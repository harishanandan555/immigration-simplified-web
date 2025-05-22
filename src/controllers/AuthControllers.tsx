// import { mockUsers } from '../utils/mockData';
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { AUTH_END_POINTS } from '../utils/constants';
import { useAutoLogout } from '../hooks/useAutoLogout';

// Define common response type
interface ApiResponse<T> {
  data: T | null;
  status: number;
  statusText: string;
}

// Feature flags
const IS_REGISTRATION_ENABLED = true;
const IS_LOGIN_ENABLED = true;
const IS_PROFILE_ENABLED = true;
const IS_LOGOUT_ENABLED = true;

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

// Registration Methods
export const registerSuperadmin = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string
): Promise<ApiResponse<User>> => {
  if (!IS_REGISTRATION_ENABLED) {
    console.log('Registration is disabled');
    return {
      data: null,
      status: 0,
      statusText: 'Registration is disabled'
    };
  }

  try {
    const response = await api.post(AUTH_END_POINTS.REGISTER_SUPERADMIN, {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: 'superadmin'
    });

    return {
      data: response.data.data || null,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error registering superadmin:', error);
    throw error;
  }
};

export const registerAttorney = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  superadminId: string,
  companyId: string
): Promise<ApiResponse<User>> => {
  if (!IS_REGISTRATION_ENABLED) {
    console.log('Registration is disabled');
    return {
      data: null,
      status: 0,
      statusText: 'Registration is disabled'
    };
  }

  try {
    const response = await api.post(AUTH_END_POINTS.REGISTER_ATTORNEY, {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: 'attorney',
      superadminId,
      companyId
    });

    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error registering attorney:', error);
    throw error;
  }
};

export const registerUser = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  role: string,
  superadminId: string,
  attorneyId: string,
  companyId: string
): Promise<ApiResponse<User>> => {
  if (!IS_REGISTRATION_ENABLED) {
    console.log('Registration is disabled');
    return {
      data: null,
      status: 0,
      statusText: 'Registration is disabled'
    };
  }

  try {
    const response = await api.post(AUTH_END_POINTS.REGISTER_USER, {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: role.toLowerCase(),
      superadminId,
      attorneyId,
      companyId
    });

    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Login Method
export const login = async (email: string, password: string): Promise<ApiResponse<User>> => {
  if (!IS_LOGIN_ENABLED) {
    console.log('Login is disabled');
    return {
      data: null,
      status: 0,
      statusText: 'Login is disabled'
    };
  }

  try {
    const response = await api.post(AUTH_END_POINTS.LOGIN, { email, password });
    
    if (!response.data) {
      throw new Error('Invalid response format from server');
    }

    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
    
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

// Profile Methods
export const getUserProfile = async (email: string, password: string): Promise<ApiResponse<User>> => {
  if (!IS_PROFILE_ENABLED) {
    console.log('Profile access is disabled');
    return {
      data: null,
      status: 0,
      statusText: 'Profile access is disabled'
    };
  }

  try {
    const response = await api.get(AUTH_END_POINTS.PROFILE_GET, { params: { email, password } });
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (email: string, password: string): Promise<ApiResponse<User>> => {
  if (!IS_PROFILE_ENABLED) {
    console.log('Profile updates are disabled');
    return {
      data: null,
      status: 0,
      statusText: 'Profile updates are disabled'
    };
  }

  try {
    const response = await api.put(AUTH_END_POINTS.PROFILE_PUT, { email, password });
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Logout Method
export const logout = (): void => {
  if (!IS_LOGOUT_ENABLED) {
    console.log('Logout is disabled');
    return;
  }

  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

// Update and Delete Methods
export const updateUser = async (userId: string, userData: Partial<User>): Promise<ApiResponse<User>> => {
  try {
    const response = await api.put(AUTH_END_POINTS.USER_UPDATE.replace(':id', userId), userData);
    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete(AUTH_END_POINTS.USER_DELETE.replace(':id', userId));
    return {
      data: null,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Context and Provider
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  registerSuperadmin: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  registerAttorney: (firstName: string, lastName: string, email: string, password: string, superadminId: string, companyId: string) => Promise<void>;
  registerUser: (firstName: string, lastName: string, email: string, password: string, role: string, superadminId: string, attorneyId: string, companyId: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  getUserProfile: (email: string, password: string) => Promise<void>;
  updateUserProfile: (email: string, password: string) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
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

  useAutoLogout();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const handleRegisterSuperadmin = async (firstName: string, lastName: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await registerSuperadmin(firstName, lastName, email, password);
      if (response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterAttorney = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    superadminId: string,
    companyId: string
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await registerAttorney(firstName, lastName, email, password, superadminId, companyId);
      if (response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterUser = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    role: string,
    superadminId: string,
    attorneyId: string,
    companyId: string
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await registerUser(firstName, lastName, email, password, role, superadminId, attorneyId, companyId);
      if (response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await login(email, password);
      if (response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetUserProfile = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await getUserProfile(email, password);
      if (response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUserProfile = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await updateUserProfile(email, password);
      if (response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const handleUpdateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await updateUser(userId, userData);
      if (response.data) {
        // If the updated user is the current user, update the local state
        if (user?._id === userId) {
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string): Promise<void> => {
    setIsLoading(true);
    try {
      await deleteUser(userId);
      // If the deleted user is the current user, log them out
      if (user?._id === userId) {
        handleLogout();
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const isSuperAdmin = user?.role === 'superadmin';
  const isAttorney = user?.role === 'attorney';
  const isParalegal = user?.role === 'paralegal';
  const isClient = user?.role === 'client';

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      registerSuperadmin: handleRegisterSuperadmin,
      registerAttorney: handleRegisterAttorney,
      registerUser: handleRegisterUser,
      login: handleLogin,
      getUserProfile: handleGetUserProfile,
      updateUserProfile: handleUpdateUserProfile,
      updateUser: handleUpdateUser,
      deleteUser: handleDeleteUser,
      logout: handleLogout,
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