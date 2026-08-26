import api from './api';

export const getDairyProfile = async () => {
  const response = await api.get('/dairy');
  return response.data;
};

export const updateDairyProfile = async (profileData) => {
  const response = await api.put('/dairy', profileData);
  return response.data;
};

export const uploadDairyLogo = async (logoFile) => {
  const formData = new FormData();
  formData.append('logo', logoFile);

  const response = await api.post('/dairy/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getSystemInfo = async () => {
  const response = await api.get('/dairy/system-info');
  return response.data;
};
