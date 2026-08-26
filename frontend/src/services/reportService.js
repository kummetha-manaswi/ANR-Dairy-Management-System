import api from './api';

export const getDashboardStats = async () => {
  const response = await api.get('/reports/dashboard');
  return response.data;
};

export const getChartsData = async () => {
  const response = await api.get('/reports/charts');
  return response.data;
};

export const getCollectionsReport = async (params = {}) => {
  const response = await api.get('/reports/collections', { params });
  return response.data;
};

export const getQualityReport = async (params = {}) => {
  const response = await api.get('/reports/quality', { params });
  return response.data;
};

export const getBillingReport = async (params = {}) => {
  const response = await api.get('/reports/billing', { params });
  return response.data;
};

export const getOutstandingReport = async (params = {}) => {
  const response = await api.get('/reports/outstanding', { params });
  return response.data;
};

export const getPassbookTimeline = async (farmerId) => {
  const response = await api.get(`/reports/passbook/${farmerId}`);
  return response.data;
};

// Excel Download URLs
const getBaseUrlAndToken = () => {
  const baseUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  return { baseUrl, token };
};

export const getBillingExcelUrl = (params = {}) => {
  const { baseUrl, token } = getBaseUrlAndToken();
  const query = new URLSearchParams({ ...params, token }).toString();
  return `${baseUrl}/api/v1/reports/billing/excel?${query}`;
};

export const getOutstandingExcelUrl = (params = {}) => {
  const { baseUrl, token } = getBaseUrlAndToken();
  const query = new URLSearchParams({ ...params, token }).toString();
  return `${baseUrl}/api/v1/reports/outstanding/excel?${query}`;
};

export const getCollectionsExcelUrl = (params = {}) => {
  const { baseUrl, token } = getBaseUrlAndToken();
  const query = new URLSearchParams({ ...params, token }).toString();
  return `${baseUrl}/api/v1/reports/collections/excel?${query}`;
};

export const getQualityExcelUrl = (params = {}) => {
  const { baseUrl, token } = getBaseUrlAndToken();
  const query = new URLSearchParams({ ...params, token }).toString();
  return `${baseUrl}/api/v1/reports/quality/excel?${query}`;
};

// PDF Download URLs
export const getCollectionsPdfUrl = (params = {}) => {
  const { baseUrl, token } = getBaseUrlAndToken();
  const query = new URLSearchParams({ ...params, token }).toString();
  return `${baseUrl}/api/v1/reports/collections/pdf?${query}`;
};

export const getQualityPdfUrl = (params = {}) => {
  const { baseUrl, token } = getBaseUrlAndToken();
  const query = new URLSearchParams({ ...params, token }).toString();
  return `${baseUrl}/api/v1/reports/quality/pdf?${query}`;
};
