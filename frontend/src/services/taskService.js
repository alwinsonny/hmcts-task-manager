import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Normalise errors so callers always get a readable message
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      'An unexpected error occurred.';
    const details = err.response?.data?.details || null;
    const error = new Error(message);
    error.details = details;
    error.status = err.response?.status;
    return Promise.reject(error);
  }
);

export const taskService = {
  /** Retrieve all tasks, optional status filter */
  getAll: (status) => {
    const params = status ? { status } : {};
    return api.get('/tasks', { params }).then((r) => r.data.data);
  },

  /** Retrieve a single task by ID */
  getById: (id) => api.get(`/tasks/${id}`).then((r) => r.data.data),

  /** Create a new task */
  create: (payload) => api.post('/tasks', payload).then((r) => r.data.data),

  /** Full update of a task */
  update: (id, payload) => api.put(`/tasks/${id}`, payload).then((r) => r.data.data),

  /** Update only the status */
  updateStatus: (id, status) =>
    api.patch(`/tasks/${id}/status`, { status }).then((r) => r.data.data),

  /** Delete a task */
  delete: (id) => api.delete(`/tasks/${id}`).then((r) => r.data.data),
};

export default taskService;
