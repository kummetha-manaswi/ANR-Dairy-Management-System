import api from './api';

// Fetch all notification templates
export const getTemplates = async () => {
  const response = await api.get('/notifications/templates');
  return response.data;
};

// Update template for a specific type (e.g. collection, bill, payment, custom)
export const updateTemplate = async (type, templateText) => {
  const response = await api.put(`/notifications/templates/${type}`, { templateText });
  return response.data;
};

// Get communication center history logs with parameters (filters, pagination, search)
export const getLogs = async (params) => {
  const response = await api.get('/notifications/logs', { params });
  return response.data;
};

// Retry a failed notification log
export const retryLog = async (id) => {
  const response = await api.post(`/notifications/logs/${id}/retry`);
  return response.data;
};

// Broadcast a message to multiple farmers
export const sendBulkNotification = async (payload) => {
  const response = await api.post('/notifications/bulk', payload);
  return response.data;
};

// Send a custom message to an individual farmer
export const sendIndividualNotification = async (payload) => {
  const response = await api.post('/notifications/individual', payload);
  return response.data;
};
