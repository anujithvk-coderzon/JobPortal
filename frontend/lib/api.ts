import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
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

// Track refresh state to prevent concurrent refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const forceLogout = () => {
  localStorage.removeItem('token');
  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login';
  }
};

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't attempt refresh for auth endpoints (login, register, refresh-token)
      if (originalRequest.url?.includes('/auth/refresh-token') ||
          originalRequest.url?.includes('/auth/login') ||
          originalRequest.url?.includes('/auth/register')) {
        forceLogout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token is sent automatically via httpOnly cookie, no body needed
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });

        const { token: newToken } = response.data.data;

        localStorage.setItem('token', newToken);

        // Update zustand store if available
        const { useAuthStore } = await import('@/store/authStore');
        useAuthStore.getState().setTokens(newToken);

        processQueue(null, newToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    } else if (error.response?.status === 403) {
      // Handle blocked or deleted users
      const code = error.response?.data?.code;
      const errorMessage = error.response?.data?.error;

      // Clear auth data
      localStorage.removeItem('token');

      if (typeof window !== 'undefined') {
        // Check if we're already on the login/register page
        const isAuthPage = window.location.pathname.startsWith('/auth/');

        if (isAuthPage) {
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
  googleRegister: (data: any) => axiosInstance.post('/auth/google/register', data),
  googleLogin: (data: any) => axiosInstance.post('/auth/google/login', data),
  logout: () => axiosInstance.post('/auth/logout'),
  forgotPassword: (data: any) => axiosInstance.post('/auth/forgot-password', data),
  resetPassword: (data: any) => axiosInstance.post('/auth/reset-password', data),
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
  uploadProfilePhoto: (data: { image: string; mimeType: string }) => axiosInstance.post('/users/profile-photo', data),
  deleteProfilePhoto: () => axiosInstance.delete('/users/profile-photo'),
  uploadResume: (data: { file: string; mimeType: string; fileName: string }) => axiosInstance.post('/users/resume', data),
  deleteResume: () => axiosInstance.delete('/users/resume'),
};

// Job API
export const jobAPI = {
  getAllJobs: (params?: any) => axiosInstance.get('/jobs', { params }),
  getJobById: (jobId: string) => axiosInstance.get(`/jobs/job/${jobId}`),
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
  getJobApplications: (jobId: string, params?: any) =>
    axiosInstance.get(`/applications/job/${jobId}`, { params }),
  updateApplicationStatus: (applicationId: string, data: any) =>
    axiosInstance.put(`/applications/${applicationId}/status`, data),
  getDashboardStats: () => axiosInstance.get('/applications/dashboard'),
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

// Follow API
export const followAPI = {
  followUser: (userId: string) => axiosInstance.post(`/follow/${userId}`),
  unfollowUser: (userId: string) => axiosInstance.delete(`/follow/${userId}`),
  getFollowing: (params?: any) => axiosInstance.get('/follow/following', { params }),
  getFollowers: (params?: any) => axiosInstance.get('/follow/followers', { params }),
  checkFollowStatus: (userId: string) => axiosInstance.get(`/follow/status/${userId}`),
  getFollowCounts: (userId: string) => axiosInstance.get(`/follow/counts/${userId}`),
  getSuggestedUsers: (params?: any) => axiosInstance.get('/follow/suggested', { params }),
};

// Report API
export const reportAPI = {
  reportPost: (postId: string, data: { reason: string; description?: string }) =>
    axiosInstance.post(`/reports/${postId}`, data),
  checkReportStatus: (postId: string) => axiosInstance.get(`/reports/status/${postId}`),
  getReportReasons: () => axiosInstance.get('/reports/reasons'),
};
