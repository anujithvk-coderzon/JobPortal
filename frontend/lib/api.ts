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

      // Replace technical error message with user-friendly one
      if (error.response?.data) {
        error.response.data.error = 'Please log in to continue.';
      }

      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    } else if (error.response?.status === 403) {
      // Handle blocked or deleted users
      const code = error.response?.data?.code;
      const errorMessage = error.response?.data?.error;

      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (typeof window !== 'undefined') {
        // Check if we're already on the login/register page
        const isAuthPage = window.location.pathname.startsWith('/auth/');

        if (isAuthPage) {
          // If already on auth page (login/register), just reject the error
          // The page will handle showing the error
          return Promise.reject(error);
        }

        // Store the error message to display on login page
        if (code === 'USER_BLOCKED') {
          localStorage.setItem('auth_error', 'Your account has been blocked. Please contact support.');
        } else if (code === 'USER_DELETED') {
          localStorage.setItem('auth_error', 'Your account has been deleted. Please contact support.');
        } else {
          localStorage.setItem('auth_error', errorMessage || 'Access denied. Please login again.');
        }

        // Redirect to login only if not already on auth page
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

const axiosInstance = api;
export default axiosInstance;

// Generic API helper that returns response.data
const apiHelper = {
  get: async (url: string, config?: any) => {
    const response = await axiosInstance.get(url, config);
    return response.data;
  },
  post: async (url: string, data?: any, config?: any) => {
    const response = await axiosInstance.post(url, data, config);
    return response.data;
  },
  put: async (url: string, data?: any, config?: any) => {
    const response = await axiosInstance.put(url, data, config);
    return response.data;
  },
  delete: async (url: string, config?: any) => {
    const response = await axiosInstance.delete(url, config);
    return response.data;
  },
};

// Export as named export
export { apiHelper as api };

// Auth API
export const authAPI = {
  requestVerificationCode: (data: any) => axiosInstance.post('/auth/request-verification-code', data),
  register: (data: any) => axiosInstance.post('/auth/register', data),
  login: (data: any) => axiosInstance.post('/auth/login', data),
  getMe: () => axiosInstance.get('/auth/me'),
  updatePassword: (data: any) => axiosInstance.put('/auth/password', data),
  googleRegister: (data: any) => axiosInstance.post('/auth/google/register', data),
  googleLogin: (data: any) => axiosInstance.post('/auth/google/login', data),
};

// User API
export const userAPI = {
  getProfile: (userId?: string) => axiosInstance.get(`/users/profile${userId ? `/${userId}` : ''}`),
  updateProfile: (data: any) => axiosInstance.put('/users/profile', data),
  updateBasicInfo: (data: any) => axiosInstance.put('/users/basic-info', data),
  addSkill: (data: any) => axiosInstance.post('/users/skills', data),
  deleteSkill: (skillId: string) => axiosInstance.delete(`/users/skills/${skillId}`),
  addExperience: (data: any) => axiosInstance.post('/users/experience', data),
  updateExperience: (experienceId: string, data: any) =>
    axiosInstance.put(`/users/experience/${experienceId}`, data),
  deleteExperience: (experienceId: string) => axiosInstance.delete(`/users/experience/${experienceId}`),
  addEducation: (data: any) => axiosInstance.post('/users/education', data),
  updateEducation: (educationId: string, data: any) =>
    axiosInstance.put(`/users/education/${educationId}`, data),
  deleteEducation: (educationId: string) => axiosInstance.delete(`/users/education/${educationId}`),
  updateCompany: (data: any) => axiosInstance.put('/users/company', data),
  uploadProfilePhoto: (data: { image: string; mimeType: string }) => axiosInstance.post('/users/profile-photo', data),
  deleteProfilePhoto: () => axiosInstance.delete('/users/profile-photo'),
  uploadResume: (data: { file: string; mimeType: string; fileName: string }) => axiosInstance.post('/users/resume', data),
  deleteResume: () => axiosInstance.delete('/users/resume'),
};

// Job API
export const jobAPI = {
  getAllJobs: (params?: any) => axiosInstance.get('/jobs', { params }),
  getJobById: (jobId: string) => axiosInstance.get(`/jobs/job/${jobId}`),
  getMyJobs: (params?: any) => axiosInstance.get('/jobs/my-jobs', { params }),
  getCompanyJobs: (companyId: string, params?: any) =>
    axiosInstance.get(`/jobs/company/${companyId}`, { params }),
  createJob: (data: any) => axiosInstance.post('/jobs', data),
  updateJob: (jobId: string, data: any) => axiosInstance.put(`/jobs/${jobId}`, data),
  deleteJob: (jobId: string) => axiosInstance.delete(`/jobs/${jobId}`),
  saveJob: (jobId: string) => axiosInstance.post(`/jobs/${jobId}/save`),
  unsaveJob: (jobId: string) => axiosInstance.delete(`/jobs/${jobId}/save`),
  getSavedJobs: (params?: any) => axiosInstance.get('/jobs/saved', { params }),
};

// Application API
export const applicationAPI = {
  applyToJob: (jobId: string, data: any) => axiosInstance.post(`/applications/apply/${jobId}`, data),
  getMyApplications: (params?: any) => axiosInstance.get('/applications/my-applications', { params }),
  getApplicationById: (applicationId: string) => axiosInstance.get(`/applications/${applicationId}`),
  getJobApplications: (jobId: string, params?: any) =>
    axiosInstance.get(`/applications/job/${jobId}`, { params }),
  updateApplicationStatus: (applicationId: string, data: any) =>
    axiosInstance.put(`/applications/${applicationId}/status`, data),
  withdrawApplication: (applicationId: string) =>
    axiosInstance.delete(`/applications/${applicationId}/withdraw`),
  getDashboardStats: () => axiosInstance.get('/applications/dashboard'),
  uploadOfferLetter: (data: { file: string; fileName: string; mimeType: string }) =>
    axiosInstance.post('/applications/upload-offer-letter', data),
};

// Job News API
export const jobNewsAPI = {
  createJobNews: (data: any) => axiosInstance.post('/job-news', data),
  getAllJobNews: (params?: any) => axiosInstance.get('/job-news', { params }),
  getJobNewsById: (id: string) => axiosInstance.get(`/job-news/${id}`),
  updateJobNews: (id: string, data: any) => axiosInstance.put(`/job-news/${id}`, data),
  deleteJobNews: (id: string) => axiosInstance.delete(`/job-news/${id}`),
  getMyJobNews: (params?: any) => axiosInstance.get('/job-news/user/my-news', { params }),
  toggleHelpful: (id: string) => axiosInstance.post(`/job-news/${id}/helpful`),
};

// Notification API
export const notificationAPI = {
  getNotifications: () => axiosInstance.get('/notifications'),
  getUnreadCount: () => axiosInstance.get('/notifications/unread-count'),
  markAsRead: (notificationId: string) => axiosInstance.delete(`/notifications/${notificationId}`),
};
