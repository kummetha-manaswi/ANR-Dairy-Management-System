import api from './api';

export const getBackupLogs = async () => {
  const response = await api.get('/backup/logs');
  return response.data;
};

export const createManualBackup = async () => {
  const response = await api.post('/backup/create');
  return response.data;
};

export const getDownloadUrl = (filename) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  return `${baseUrl}/backup/download/${filename}?token=${localStorage.getItem('token')}`;
};

export const parseBackupMetadata = async (backupContent) => {
  const response = await api.post('/backup/parse', { backupContent });
  return response.data;
};

export const restoreDatabase = async (backupContent, confirmRestore = true) => {
  const response = await api.post('/backup/restore', { backupContent, confirmRestore });
  return response.data;
};
