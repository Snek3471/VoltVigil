import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
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

// Subscriber management
export const getSubscribers = () => api.get('/api/subscribers');
export const createSubscriber = (data) => api.post('/api/subscribers', data);
export const deleteSubscriber = (id) => api.delete(`/api/subscribers/${id}`);
export const updateSubscriber = (id, data) => api.patch(`/api/subscribers/${id}`, data);

// Notification log
export const getNotificationLog = () => api.get('/api/notifications/log');

export default api;
