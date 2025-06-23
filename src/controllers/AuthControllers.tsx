// import { mockUsers } from '../utils/mockData';
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { AUTH_END_POINTS } from '../utils/constants';
import { useAutoLogout } from '../hooks/useAutoLogout';
import toast from 'react-hot-toast';

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
  userType?: 'individual' | 'company';
  avatar?: string;
  token?: string;
  companyId?: string;
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
    
  } catch (error: any) {
    console.error('Error registering attorney:', error);
    if (error.response?.data?.error === 'user_limit_reached') {
      toast.error('Please contact your company administrator to upgrade your plan');
    } else if (error.response?.data?.error === 'attorney_limit_reached') {
      const details = error.response?.data?.details;
      toast.error(`Attorney limit reached. Current: ${details?.currentAttorneys}/${details?.attorneyLimit}. ${details?.action}`);
    }
    throw error;
  }
};

export const registerUser = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  role: string,
  userType: 'individual' | 'company',
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
      userType,
      superadminId,
      attorneyId,
      companyId
    });

    return {
      data: response.data.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error: any) {
    console.error('Error registering user:', error);
    if (error.response?.data?.error === 'user_limit_reached') {
      const details = error.response?.data?.details;
      toast.error(`User limit reached. Current: ${details?.currentUsers}/${details?.userLimit}. ${details?.action}`);
    } else if (error.response?.data?.error === 'paralegal_limit_reached') {
      const details = error.response?.data?.details;
      toast.error(`Paralegal limit reached. Current: ${details?.currentParalegals}/${details?.paralegalLimit}. ${details?.action}`);
    } else if (error.response?.data?.error === 'client_limit_reached') {
      const details = error.response?.data?.details;
      toast.error(`Client limit reached. Current: ${details?.currentClients}/${details?.clientLimit}. ${details?.action}`);
    } else {
      toast.error(error.response?.data?.message || 'Error registering user');
    }
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

    // Ensure we have the complete user data including companyId
    const userData = response.data.data || response.data;
    console.log('Raw login response:', response.data); // Debug log

    return {
      data: userData,
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
  localStorage.removeItem('companyId');
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

export const getUserById = async (userId: string): Promise<ApiResponse<User[]>> => {
  try {
    const response = await api.get(AUTH_END_POINTS.GET_USERS_BY_ID.replace(':id', userId));
    return {
      data: Array.isArray(response.data.data) ? response.data.data : [response.data.data],
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

// Context and Provider
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  registerSuperadmin: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  registerAttorney: (firstName: string, lastName: string, email: string, password: string, superadminId: string, companyId: string) => Promise<void>;
  registerUser: (firstName: string, lastName: string, email: string, password: string, role: string, userType: 'individual' | 'company', superadminId: string, attorneyId: string, companyId: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  getUserProfile: (email: string, password: string) => Promise<void>;
  updateUserProfile: (email: string, password: string) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getUserById: (userId: string) => Promise<void>;
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
    userType: 'individual' | 'company',
    superadminId: string,
    attorneyId: string,
    companyId: string
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await registerUser(firstName, lastName, email, password, role, userType, superadminId, attorneyId, companyId);
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
        console.log('Login response data:', response.data); // Debug log
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        // Store companyId for attorney, paralegal, or client
        if ((response.data.role === 'attorney' || response.data.role === 'paralegal' || response.data.role === 'client')) {
          const companyId = response.data.companyId;
          console.log('Company ID from response:', companyId); // Debug log
          if (companyId) {
            localStorage.setItem('companyId', companyId);
          } else {
            console.warn('Company ID is undefined for user:', response.data.email);
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error);
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

  const handleGetUserById = async (userId: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await getUserById(userId);
      if (response.data) {
        // Only update the user state if the fetched user is the current user
        if (user?._id === userId) {
          setUser(response.data[0]);
          localStorage.setItem('user', JSON.stringify(response.data[0]));
        }
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
      getUserById: handleGetUserById,
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