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

/** POST fake alerts for testing (map, feed, socket). Query: count (1–25, default 8) */
export const simulateAlerts = (count = 8) =>
  api.post('/api/alerts/simulate', null, { params: { count } });

// Subscriber management
export const getSubscribers = () => api.get('/api/subscribers');
export const createSubscriber = (data) => api.post('/api/subscribers', data);
export const deleteSubscriber = (id) => api.delete(`/api/subscribers/${id}`);
export const updateSubscriber = (id, data) => api.patch(`/api/subscribers/${id}`, data);

// Notification log
export const getNotificationLog = () => api.get('/api/notifications/log');

export default api;
