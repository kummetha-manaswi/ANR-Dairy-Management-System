import api from './api';

export const generateInvoice = async (invoiceData) => {
  const response = await api.post('/invoices', invoiceData);
  return response.data;
};

export const getInvoices = async (params = {}) => {
  const response = await api.get('/invoices', { params });
  return response.data;
};

export const getInvoiceById = async (id) => {
  const response = await api.get(`/invoices/${id}`);
  return response.data;
};

export const cancelInvoice = async (id, reason) => {
  const response = await api.put(`/invoices/${id}/cancel`, { reason });
  return response.data;
};

export const getInvoicePdfUrl = (id) => {
  const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  return `${baseUrl}/api/v1/invoices/${id}/pdf?token=${token}`;
};
