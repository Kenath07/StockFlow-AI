import apiClient from './apiClient';

const customerService = {
  getAll: async () => {
    const response = await apiClient.get('/customers');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/customers', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/customers/${id}`, data);
    return response.data;
  },
};

export default customerService;
