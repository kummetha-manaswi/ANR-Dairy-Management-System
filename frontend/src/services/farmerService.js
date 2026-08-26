import api from './api';

export const getFarmers = async (params = {}) => {
  const response = await api.get('/farmers', { params });
  return response.data;
};

export const getFarmerById = async (id) => {
  const response = await api.get(`/farmers/${id}`);
  return response.data;
};

export const addFarmer = async (farmerData) => {
  // Check if farmerData is a FormData object (required for file uploads)
  const isFormData = farmerData instanceof FormData;
  const response = await api.post('/farmers', farmerData, {
    headers: {
      'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
    },
  });
  return response.data;
};

export const updateFarmer = async (id, farmerData) => {
  const isFormData = farmerData instanceof FormData;
  const response = await api.put(`/farmers/${id}`, farmerData, {
    headers: {
      'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
    },
  });
  return response.data;
};

export const toggleFarmerStatus = async (id, status, reason = '') => {
  const response = await api.patch(`/farmers/${id}/status`, { status, reason });
  return response.data;
};

export const deleteFarmer = async (id, reason = '') => {
  // Pass the delete reason in the request body (using config.data in DELETE)
  const response = await api.delete(`/farmers/${id}`, { data: { reason } });
  return response.data;
};
