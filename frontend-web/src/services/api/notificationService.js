import apiClient from './apiClient';

const notificationService = {
  send: async (data) => {
    const response = await apiClient.post('/notifications/send', data);
    return response.data;
  },

  getLogs: async (params = {}) => {
    const response = await apiClient.get('/notifications/history', { params });
    return response.data;
  },
};

export default notificationService;
