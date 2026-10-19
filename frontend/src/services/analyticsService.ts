import api from './api';

export const analyticsService = {
  getElectionStats: async (electionId: string) => {
    const response = await api.get(`/analytics/election/${electionId}/stats`);
    return response.data.data;
  },

  getSystemStats: async () => {
    const response = await api.get('/analytics/system/stats');
    return response.data.data;
  },

  getElectionReport: async (electionId: string) => {
    const response = await api.get(`/analytics/election/${electionId}/report`);
    return response.data.data;
  },

  exportReportAsPDF: async (electionId: string) => {
    const response = await api.get(`/analytics/election/${electionId}/report/pdf`);
    return response.data;
  },

  exportReportAsCSV: async (electionId: string) => {
    const response = await api.get(`/analytics/election/${electionId}/report/csv`);
    return response.data;
  },

  getMyCandidacies: async () => {
    const response = await api.get('/analytics/me/candidacy');
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
