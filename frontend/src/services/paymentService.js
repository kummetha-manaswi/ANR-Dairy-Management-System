import api from './api';

export const recordPayment = async (paymentData) => {
  const response = await api.post('/payments', paymentData);
  return response.data;
};

export const getPayments = async (params = {}) => {
  const response = await api.get('/payments', { params });
  return response.data;
};

export const deletePayment = async (id, reason) => {
  const response = await api.delete(`/payments/${id}`, { data: { reason } });
  return response.data;
};
