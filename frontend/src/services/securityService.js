import api from './api';

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.put('/security/change-password', { currentPassword, newPassword });
  return response.data;
};

export const getActiveSessions = async () => {
  const response = await api.get('/security/sessions');
  return response.data;
};

export const terminateSession = async (id) => {
  const response = await api.delete(`/security/sessions/${id}`);
  return response.data;
};

export const logoutAllDevices = async () => {
  const response = await api.post('/security/sessions/logout-all');
  return response.data;
};

export const getLoginHistory = async () => {
  const response = await api.get('/security/history');
  return response.data;
};

export const getAuditLogs = async () => {
  const response = await api.get('/security/logs');
  return response.data;
};
