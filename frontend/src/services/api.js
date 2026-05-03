import axios from 'axios';

// Update this URL to match your backend server
// For Android Emulator: http://10.0.2.2:5000
// For iOS Simulator: http://localhost:5000
// For physical device: http://YOUR_COMPUTER_IP:5000

const API_BASE_URL = 'http://10.15.108.17:5000';
// const API_BASE_URL = 'https://nivaran-n0fi.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Token is set in AuthContext when user logs in
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.log('API Error:', error.response.status, error.response.data?.message);

      if (error.response.status === 401) {
        // Token expired - handle in AuthContext
        console.log('Authentication expired');
      }
    } else if (error.request) {
      // No response received
      console.log('Network Error: No response from server');
    } else {
      console.log('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
