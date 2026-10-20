import api from './api';

export const analyticsService = {
  getSystemStats: async () => {
    const response = await api.get('/analytics/system/stats');
    return response.data.data;
  },

  getAllActivity: async (limit = 50, action = '') => {
    const response = await api.get('/analytics/system/activity', { params: { limit, action: action || undefined } });
    return response.data.data as { items: any[]; total: number };
  },

  getUserActivityLog: async (limit = 50) => {
    const response = await api.get('/analytics/user/activity-log', { params: { limit } });
    return response.data.data;
  }
};
