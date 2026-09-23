import apiClient from './apiClient';

const stockService = {
  getLevels: async () => {
    const response = await apiClient.get('/stock/levels');
    return response.data;
  },

  getMovements: async (params = {}) => {
    const response = await apiClient.get('/stock/movements', { params });
    return response.data;
  },

  adjustStock: async (data) => {
    const response = await apiClient.post('/stock/adjustments', data);
    return response.data;
  },

  getThresholds: async () => {
    const response = await apiClient.get('/stock/thresholds');
    return response.data;
  },

  updateThreshold: async (id, data) => {
    const response = await apiClient.put(`/stock/thresholds/${id}`, data);
    return response.data;
  },

  getHistory: async (productId) => {
    const response = await apiClient.get(`/stock/history/${productId}`);
    return response.data;
  },
};

export default stockService;
