import api from './api';

export const getCollections = async (params = {}) => {
  const response = await api.get('/collections', { params });
  return response.data;
};

export const addCollection = async (collectionData) => {
  const response = await api.post('/collections', collectionData);
  return response.data;
};

export const updateCollection = async (id, collectionData) => {
  const response = await api.put(`/collections/${id}`, collectionData);
  return response.data;
};

export const deleteCollection = async (id, reason = '') => {
  const response = await api.delete(`/collections/${id}`, { data: { reason } });
  return response.data;
};

export const unlockCollection = async (id, reason) => {
  const response = await api.patch(`/collections/${id}/unlock`, { reason });
  return response.data;
};

export const getTodaySummary = async () => {
  const response = await api.get('/collections/today-summary');
  return response.data;
};
