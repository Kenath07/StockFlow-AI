import apiClient from './apiClient';

const agentService = {
  startReorder: async (data = {}) => {
    const response = await apiClient.post('/agent/reorder', data);
    return response.data;
  },

  getAll: async (params = {}) => {
    const response = await apiClient.get('/agent/workflows', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/agent/workflows/${id}`);
    return response.data;
  },

  approve: async (id, data = {}) => {
    const response = await apiClient.post(`/agent/workflows/${id}/approve`, data);
    return response.data;
  },

  reject: async (id, data) => {
    const response = await apiClient.post(`/agent/workflows/${id}/reject`, data);
    return response.data;
  },

  getSummary: async (id) => {
    const response = await apiClient.get(`/agent/workflows/${id}/summary`);
    return response.data;
  },
};

export default agentService;
