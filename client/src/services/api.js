import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const accidentAPI = {
  getAll: (params) => api.get('/accidents', { params }),
  getStats: () => api.get('/accidents/stats'),
  upload: (formData) => api.post('/accidents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/accidents/${id}`),
  update: (id, data) => api.put(`/accidents/${id}`, data),
};

export const mlAPI = {
  predictSeverity: (data) => api.post('/predict-severity', data),
  getHotspots: (algorithm = 'dbscan') => api.get(`/hotspots?algorithm=${algorithm}`),
};

export default api;
