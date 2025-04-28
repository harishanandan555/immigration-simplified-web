import axios, { AxiosResponse, AxiosError } from 'axios';
import { APPCONSTANTS, AUTH_END_POINTS } from './constants';

// Create an Axios instance
const api = axios.create({
  baseURL: APPCONSTANTS.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach token if needed
api.interceptors.request.use(
  (config: any): any => {
    // Skip token for auth endpoints
    if (config.url && 
        !config.url.includes(AUTH_END_POINTS.REGISTER) && 
        !config.url.includes(AUTH_END_POINTS.LOGIN)) {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
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
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const message = (error.response.data as any)?.message || error.response.data;

      // Handle specific error cases
      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          localStorage.removeItem('token');
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

export default api;