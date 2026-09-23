import apiClient from './apiClient';

const orderService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/orders', data);
    return response.data;
  },

  updateStatus: async (id, data) => {
    const response = await apiClient.put(`/orders/${id}/status`, data);
    return response.data;
  },

  cancel: async (id) => {
    const response = await apiClient.post(`/orders/${id}/cancel`);
    return response.data;
  },
};

export default orderService;
