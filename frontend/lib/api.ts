import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data: any) => api.put('/auth/password', data),
};

// User API
export const userAPI = {
  getProfile: (userId?: string) => api.get(`/users/profile${userId ? `/${userId}` : ''}`),
  updateProfile: (data: any) => api.put('/users/profile', data),
  updateBasicInfo: (data: any) => api.put('/users/basic-info', data),
  addSkill: (data: any) => api.post('/users/skills', data),
  deleteSkill: (skillId: string) => api.delete(`/users/skills/${skillId}`),
  addExperience: (data: any) => api.post('/users/experience', data),
  updateExperience: (experienceId: string, data: any) =>
    api.put(`/users/experience/${experienceId}`, data),
  deleteExperience: (experienceId: string) => api.delete(`/users/experience/${experienceId}`),
  addEducation: (data: any) => api.post('/users/education', data),
  updateEducation: (educationId: string, data: any) =>
    api.put(`/users/education/${educationId}`, data),
  deleteEducation: (educationId: string) => api.delete(`/users/education/${educationId}`),
  updateCompany: (data: any) => api.put('/users/company', data),
};

// Job API
export const jobAPI = {
  getAllJobs: (params?: any) => api.get('/jobs', { params }),
  getJobById: (jobId: string) => api.get(`/jobs/job/${jobId}`),
  getMyJobs: (params?: any) => api.get('/jobs/my-jobs', { params }),
  getCompanyJobs: (companyId: string, params?: any) =>
    api.get(`/jobs/company/${companyId}`, { params }),
  createJob: (data: any) => api.post('/jobs', data),
  updateJob: (jobId: string, data: any) => api.put(`/jobs/${jobId}`, data),
  deleteJob: (jobId: string) => api.delete(`/jobs/${jobId}`),
  saveJob: (jobId: string) => api.post(`/jobs/${jobId}/save`),
  unsaveJob: (jobId: string) => api.delete(`/jobs/${jobId}/save`),
  getSavedJobs: (params?: any) => api.get('/jobs/saved', { params }),
};

// Application API
export const applicationAPI = {
  applyToJob: (jobId: string, data: any) => api.post(`/applications/apply/${jobId}`, data),
  getMyApplications: (params?: any) => api.get('/applications/my-applications', { params }),
  getApplicationById: (applicationId: string) => api.get(`/applications/${applicationId}`),
  getJobApplications: (jobId: string, params?: any) =>
    api.get(`/applications/job/${jobId}`, { params }),
  updateApplicationStatus: (applicationId: string, data: any) =>
    api.put(`/applications/${applicationId}/status`, data),
  withdrawApplication: (applicationId: string) =>
    api.delete(`/applications/${applicationId}/withdraw`),
  getDashboardStats: () => api.get('/applications/dashboard'),
};

// Job News API
export const jobNewsAPI = {
  createJobNews: (data: any) => api.post('/job-news', data),
  getAllJobNews: (params?: any) => api.get('/job-news', { params }),
  getJobNewsById: (id: string) => api.get(`/job-news/${id}`),
  updateJobNews: (id: string, data: any) => api.put(`/job-news/${id}`, data),
  deleteJobNews: (id: string) => api.delete(`/job-news/${id}`),
  getMyJobNews: (params?: any) => api.get('/job-news/user/my-news', { params }),
  toggleHelpful: (id: string) => api.post(`/job-news/${id}/helpful`),
};
