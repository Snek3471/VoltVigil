import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getAlerts = (filters = {}) => {
  const params = {};
  if (filters.severity) params.severity = filters.severity;
  if (filters.nodeId) params.nodeId = filters.nodeId;
  return api.get('/api/alerts', { params });
};

export const deleteAlert = (id) => api.delete(`/api/alerts/${id}`);

export default api;
