import apiClient from './apiClient';

const fieldService = {
  getAgents: async () => {
    const response = await apiClient.get('/field/agents');
    return response.data;
  },

  getVisits: async (params = {}) => {
    const response = await apiClient.get('/field/visits', { params });
    return response.data;
  },

  createVisit: async (agentId, data) => {
    const response = await apiClient.post(`/field/visits/${agentId}`, data);
    return response.data;
  },

  getCaptures: async (params = {}) => {
    const response = await apiClient.get('/field/captures', { params });
    return response.data;
  },

  getSyncQueue: async () => {
    const response = await apiClient.get('/field/sync');
    return response.data;
  },

  getMyOrders: async () => {
    const response = await apiClient.get('/field/my-orders');
    return response.data;
  },

  checkStock: async (productId) => {
    const response = await apiClient.get(`/field/stock-check/${productId}`);
    return response.data;
  },
};

export default fieldService;
