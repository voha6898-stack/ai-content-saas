import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  getMe:    ()     => api.get('/auth/me'),
};

export const contentAPI = {
  generate:       (data)                                => api.post('/content/generate', data),
  getHistory:     (page = 1, limit = 8, platform = '', favorites = false) =>
    api.get('/content/history', { params: { page, limit, ...(platform && { platform }), ...(favorites && { favorites: true }) } }),
  toggleFavorite: (id)                                  => api.patch(`/content/${id}/favorite`),
  delete:         (id)                                  => api.delete(`/content/${id}`),
};

export const distributionAPI = {
  schedule:     (data)               => api.post('/distribution/schedule', data),
  getJobs:      (params = {})        => api.get('/distribution/jobs', { params }),
  getJobDetail: (id)                 => api.get(`/distribution/jobs/${id}`),
  cancelJob:    (id)                 => api.delete(`/distribution/jobs/${id}`),
};

export const pipelineAPI = {
  create:    (data)        => api.post('/pipeline', data),
  getAll:    (params = {}) => api.get('/pipeline', { params }),
  getStatus: (id)          => api.get(`/pipeline/${id}`),
  delete:    (id)          => api.delete(`/pipeline/${id}`),
};

export const monetizationAPI = {
  getAffiliateLinks: (contentId) => api.get(`/monetization/affiliate/${contentId}`),
  generateCTA:       (contentId, affiliateLinkId) => api.post(`/monetization/cta/${contentId}`, { affiliateLinkId }),
  getRPMOptimization:(contentId) => api.get(`/monetization/rpm/${contentId}`),
  addCustomLink:     (data)      => api.post('/monetization/links', data),
  getMyLinks:        ()          => api.get('/monetization/links'),
};

export const growthAPI = {
  generate:   (data) => api.post('/growth/generate', data),
  getHistory: (page = 1, limit = 6, platform = '') =>
    api.get('/growth/history', { params: { page, limit, ...(platform && { platform }) } }),
  getOne:     (id)  => api.get(`/growth/${id}`),
  delete:     (id)  => api.delete(`/growth/${id}`),
};

export const scriptAPI = {
  generate:       (data) => api.post('/script/generate', data),
  getHistory:     (page = 1, limit = 8, platform = '') =>
    api.get('/script/history', { params: { page, limit, ...(platform && { platform }) } }),
  toggleFavorite: (id)   => api.patch(`/script/${id}/favorite`),
  delete:         (id)   => api.delete(`/script/${id}`),
};

export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
};

export const automationAPI = {
  // Rules
  createRule:  (data)        => api.post('/automation/rules', data),
  getRules:    ()            => api.get('/automation/rules'),
  updateRule:  (id, data)    => api.patch(`/automation/rules/${id}`, data),
  deleteRule:  (id)          => api.delete(`/automation/rules/${id}`),
  triggerRun:  (id)          => api.post(`/automation/rules/${id}/run`),
  // Runs
  getRuns:     (ruleId = '') => api.get('/automation/runs', { params: ruleId ? { ruleId } : {} }),
  // Trends
  getTrends:   (params = {}) => api.get('/automation/trends', { params }),
  fetchTrends: (data)        => api.post('/automation/trends/fetch', data),
};

export const paymentAPI = {
  // Manual bank transfer
  getBankInfo:    ()     => api.get('/payment/bank-info'),
  submitManual:   ()     => api.post('/payment/manual'),
  getManualStatus:()     => api.get('/payment/manual/status'),
};

export const adminPaymentAPI = {
  getRequests:  ()         => api.get('/admin/payment-requests'),
  approve:      (id)       => api.patch(`/admin/payment-requests/${id}/approve`),
  reject:       (id, note) => api.patch(`/admin/payment-requests/${id}/reject`, { note }),
};

export const adminAPI = {
  setupSelf:    ()                  => api.post('/admin/setup-self'),
  getStats:     ()                  => api.get('/admin/stats'),
  getUsers:     (params = {})       => api.get('/admin/users', { params }),
  updateUser:   (id, data)          => api.patch(`/admin/users/${id}`, data),
  deleteUser:   (id)                => api.delete(`/admin/users/${id}`),
};

export default api;
