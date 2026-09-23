import apiClient from './apiClient';

const reportService = {
  getLowStock: async () => {
    const response = await apiClient.get('/reports/low-stock');
    return response.data;
  },

  getSalesVelocity: async () => {
    const response = await apiClient.get('/reports/sales-velocity');
    return response.data;
  },

  getAgentPerformance: async () => {
    const response = await apiClient.get('/reports/agent-performance');
    return response.data;
  },

  getNotificationAudit: async () => {
    const response = await apiClient.get('/reports/notifications');
    return response.data;
  },
};

export default reportService;
