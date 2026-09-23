import apiClient from './apiClient';

const authService = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  register: async (data) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  getAllUsers: async () => {
    try {
      const response = await apiClient.get('/auth/users');
      return response.data || [];
    } catch {
      return [];
    }
  },
};

export default authService;
