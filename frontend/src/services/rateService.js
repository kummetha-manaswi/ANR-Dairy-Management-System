import api from './api';

export const getRateCharts = async (params = {}) => {
  const response = await api.get('/rates', { params });
  return response.data;
};

export const getRateChartById = async (id) => {
  const response = await api.get(`/rates/${id}`);
  return response.data;
};

export const createRateChart = async (chartData) => {
  const response = await api.post('/rates', chartData);
  return response.data;
};

export const updateRateChart = async (id, chartData) => {
  const response = await api.put(`/rates/${id}`, chartData);
  return response.data;
};

export const activateRateChart = async (id, reason = '') => {
  const response = await api.put(`/rates/${id}/activate`, { reason });
  return response.data;
};

export const calculateRatePreview = async (milkType, fat, snf) => {
  const response = await api.get('/rates/calculate', {
    params: { milkType, fat, snf }
  });
  return response.data;
};

export const deleteRateChart = async (id, reason = '') => {
  const response = await api.delete(`/rates/${id}`, { data: { reason } });
  return response.data;
};
