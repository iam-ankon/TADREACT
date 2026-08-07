// services/authService.js
import axios from 'axios';

const API_BASE_URL = 'http://119.148.51.38:8000';

const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

export const authService = {
  login: async (username, password) => {
    try {
      // Try both possible login endpoints
      const endpoints = [
        '/api-token-auth/',  // DRF token auth
        '/api/auth/login/',  // Custom login
        '/api/login/',       // Another common endpoint
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying login at: ${API_BASE_URL}${endpoint}`);
          const response = await authApi.post(endpoint, {
            username,
            password
          });
          
          console.log(`Login successful at ${endpoint}:`, response.data);
          
          // Handle different response formats
          const token = response.data.token || response.data.key || response.data.access;
          if (token) {
            localStorage.setItem('token', token);
            return { success: true, token };
          }
        } catch (e) {
          console.log(`Login failed at ${endpoint}:`, e.response?.status);
        }
      }
      
      throw new Error('Could not authenticate with any endpoint');
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  },
  
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const response = await authApi.get('/api/user/', {
        headers: { Authorization: `Token ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
  }
};

export default authService;