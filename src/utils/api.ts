import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { APPCONSTANTS, AUTH_END_POINTS } from './constants';

// Create an Axios instance
const api = axios.create({
  baseURL: APPCONSTANTS.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Extend the InternalAxiosRequestConfig type to include _retry
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const { exp } = JSON.parse(jsonPayload);
    // Consider token expired if it's within 5 minutes of expiration
    return (exp * 1000) - (5 * 60 * 1000) < Date.now();
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // If there's an error parsing the token, consider it expired
  }
};

// Function to refresh token
const refreshToken = async (): Promise<string | null> => {
  try {
    const response = await api.post(AUTH_END_POINTS.REFRESH_TOKEN);
    const newToken = response.data.token;
    if (newToken) {
      localStorage.setItem('token', newToken);
      return newToken;
    }
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

// Intercept requests to attach token if needed
api.interceptors.request.use(
  async (config: CustomAxiosRequestConfig): Promise<CustomAxiosRequestConfig> => {
    // Skip token for auth endpoints
    if (config.url && 
        !config.url.includes(AUTH_END_POINTS.REGISTER_SUPERADMIN) && 
        !config.url.includes(AUTH_END_POINTS.LOGIN) &&
        !config.url.includes(AUTH_END_POINTS.REFRESH_TOKEN)) {
      const token = localStorage.getItem('token');
      if (token) {
        // Check if token is expired or about to expire
        if (isTokenExpired(token)) {
          // Try to refresh the token
          const newToken = await refreshToken();
          if (newToken) {
            if (config.headers) {
              config.headers.Authorization = `Bearer ${newToken}`;
            }
            return config;
          } else {
            // If refresh fails, clear tokens and reject
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return Promise.reject('Token expired and refresh failed');
          }
        }
        if (config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Intercept responses to handle token updates and errors
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    const { data } = response;

    // Handle successful login
    if (response.config.url?.includes(AUTH_END_POINTS.LOGIN)) {
      if (data?.token) {
        localStorage.setItem('token', data.token);
      }
      if (data?.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    }

    return response;
  },
  async (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const message = (error.response.data as any)?.message || error.response.data;

      // Handle specific error cases
      switch (status) {
        case 401:
          // Unauthorized - try to refresh token
          const originalRequest = error.config as CustomAxiosRequestConfig;
          if (originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
              const newToken = await refreshToken();
              if (newToken) {
                // Retry the original request with new token
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }
                return api(originalRequest);
              }
            } catch (refreshError) {
              // If refresh fails, clear tokens and redirect to login
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/';
              return Promise.reject(refreshError);
            }
          }
          break;
        case 403:
          // Forbidden - user doesn't have permission
          alert('You do not have permission to perform this action.');
          break;
        case 404:
          // Not Found
          console.error('Resource not found:', error.config?.url);
          break;
        case 500:
          // Server Error
          console.error('Server error:', message);
          break;
        default:
          console.error('API Error:', message);
      }

      return Promise.reject(error);
    } else if (error.request) {
      // Network error - no response received
      console.error('No response from server:', error.request);
      alert('Unable to connect to the server. Please check your internet connection.');
      return Promise.reject(error);
    } else {
      // Request setup error
      console.error('Request error:', error.message);
      return Promise.reject(error);
    }
  }
);

export default api;