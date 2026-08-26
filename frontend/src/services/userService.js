import api from './api';

export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

export const toggleUserStatus = async (id, status) => {
  const response = await api.put(`/users/${id}/status`, { status });
  return response.data;
};

export const resetPassword = async (id, password) => {
  const response = await api.put(`/users/${id}/reset-password`, { password });
  return response.data;
};
