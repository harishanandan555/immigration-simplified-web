import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { APPCONSTANTS, AUTH_END_POINTS } from './constants';
import { setupSecurityInterceptor } from '../services/passwordSecurityMonitor';

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
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      console.log('No token found for refresh');
      return null;
    }

    // Create a new axios instance without interceptors to avoid infinite loops
    const refreshApi = axios.create({
      baseURL: APPCONSTANTS.API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
    });

    console.log('Attempting to refresh token...');
    const response = await refreshApi.post(AUTH_END_POINTS.REFRESH_TOKEN);
    
    const newToken = response.data.token || response.data.data?.token;
    if (newToken) {
      console.log('Token refreshed successfully');
      localStorage.setItem('token', newToken);
      return newToken;
    }
    
    console.log('No new token received in refresh response');
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    // Clear invalid tokens
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
};

// Intercept requests to attach token if needed
api.interceptors.request.use(
  async (config: CustomAxiosRequestConfig): Promise<CustomAxiosRequestConfig> => {
    // Skip token for auth endpoints (except refresh which needs the current token)
    const skipTokenEndpoints = [
      AUTH_END_POINTS.REGISTER_SUPERADMIN,
      AUTH_END_POINTS.LOGIN
    ];
    
    const needsToken = !skipTokenEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (needsToken) {
      const token = localStorage.getItem('token');
      if (token) {
        // For refresh token endpoint, always use current token
        if (config.url?.includes(AUTH_END_POINTS.REFRESH_TOKEN)) {
          if (config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } else {
          // For other endpoints, check if token is expired
          if (isTokenExpired(token)) {
            console.log('Token expired, attempting refresh before request');
            const newToken = await refreshToken();
            if (newToken) {
              if (config.headers) {
                config.headers.Authorization = `Bearer ${newToken}`;
              }
            } else {
              // If refresh fails, clear tokens and redirect
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
              return Promise.reject(new Error('Token expired and refresh failed'));
            }
          } else {
            if (config.headers) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          }
        }
      } else if (!config.url?.includes('my-assignments') && !config.url?.includes('questionnaires')) {
        // Only redirect for non-client endpoints if no token
        console.log('No token found for protected endpoint');
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
          // Unauthorized - try to refresh token if not already attempted
          const originalRequest = error.config as CustomAxiosRequestConfig;
          
          // Don't retry refresh token endpoint failures
          if (originalRequest?.url?.includes(AUTH_END_POINTS.REFRESH_TOKEN)) {
            console.log('Refresh token failed, redirecting to login');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            break;
          }
          
          if (originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
              console.log('401 error, attempting token refresh');
              const newToken = await refreshToken();
              if (newToken) {
                // Retry the original request with new token
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }
                console.log('Retrying request with new token');
                return api(originalRequest);
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              // If refresh fails, clear tokens and redirect to login
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
              return Promise.reject(refreshError);
            }
          }
          // If we get here, redirect to login
          console.log('Could not refresh token, redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
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

// Setup security monitoring for password-related endpoints
setupSecurityInterceptor(api);

export default api;