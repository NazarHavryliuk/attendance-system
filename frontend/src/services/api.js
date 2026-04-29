import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (API_KEY) {
    config.headers['x-api-key'] = API_KEY;
  }
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),
  changePassword: (payload) => api.put('/auth/change-password', payload),
  bootstrapAdmin: (payload) => api.post('/auth/bootstrap-admin', payload),
};

export const groupsApi = {
  getAll: () => api.get('/groups'),
  create: (payload) => api.post('/groups/register', payload),
  update: (id, payload) => api.put(`/groups/${id}`, payload),
  remove: (id) => api.delete(`/groups/${id}`),
};

export const studentsApi = {
  getAll: () => api.get('/students'),
  create: (payload) => api.post('/students/register', payload),
  update: (id, payload) => api.put(`/students/${id}`, payload),
  remove: (id) => api.delete(`/students/${id}`),
};

export const lessonsApi = {
  getAll: () => api.get('/lessons'),
  create: (payload) => api.post('/lessons/register', payload),
  remove: (id) => api.delete(`/lessons/${id}`),
};

export const attendanceApi = {
  register: (payload) => api.post('/attendance/register', payload),
  byLesson: (lessonId) => api.get(`/attendance/${lessonId}`),
  lessonReport: (lessonId) => api.get(`/attendance/lesson-report/${lessonId}`),
};

export const lessonSessionsApi = {
  create: (payload) => api.post('/lesson-sessions', payload),
  byLesson: (lessonId) => api.get(`/lesson-sessions/${lessonId}`),
  remove: (id) => api.delete(`/lesson-sessions/${id}`),
};

export const reportsApi = {
  student: (id) => api.get(`/report/student/${id}`),
  studentBySubject: (id) => api.get(`/report/student/${id}/by-subject`),
  group: (groupId) => api.get(`/report/group/${groupId}`),
  groupTable: (groupId) => api.get(`/report/group/${groupId}/attendance-table`),
  lesson: (lessonId) => api.get(`/report/lesson/${lessonId}`),
};

export const statisticsApi = {
  byStudent: (studentId) => api.get(`/statistics/${studentId}`),
};

export const usersApi = {
  getAll: () => api.get('/users'),
  create: (payload) => api.post('/users/register', payload),
  update: (id, payload) => api.put(`/users/${id}`, payload),
  remove: (id) => api.delete(`/users/${id}`),
};

export const uploadApi = {
  userPhoto: (userId, file) => {
    const form = new FormData();
    form.append('photo', file);
    return api.post(`/upload/user/${userId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  studentPhoto: (studentId, file) => {
    const form = new FormData();
    form.append('photo', file);
    return api.post(`/upload/student/${studentId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
