import axios, { AxiosResponse, AxiosError } from 'axios';
import { APPCONSTANTS } from './constants';

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
    if (config.url && !config.url.includes('/register') && !config.url.includes('/login')) {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Intercept responses to handle token updates
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    const { data } = response;

    if (response.config.url === '/api/users/login') {
      localStorage.setItem('authData', JSON.stringify(data));
      localStorage.setItem('UserId', data.id);
    }

    if (data?.token) {
      localStorage.setItem('token', data.token);
    }

    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const message = (error.response.data as any)?.message || error.response.data;

      if (!error.response.data && error.code === 'ERR_BAD_REQUEST') {
        alert('The server is currently unavailable. Please try again later.');
      }

      if ([400, 401, 500].includes(status)) {
        if (message) {
          alert(`Error Message: ${message}`);
        } else {
          console.error('Unauthorized, possibly due to expired token. Redirecting to login...');
        }

        // Optional: clear session and redirect
        // localStorage.clear();
        // window.location.href = "/login";
      } else {
        console.error('Internal Server Error. Please try again later.');
      }

      return error.response;
    } else if (error.request) {
      console.error('No response from the server. API may not be running.');
      alert('The server is currently unavailable. Please try again later.');
      return error.request;
    } else {
      console.error('Error in API request:', error.message);
      return error.message;
    }
  }
);

export default api;