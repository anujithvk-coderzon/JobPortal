const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class AdminApi {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('admin_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Request failed',
        };
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request<{ admin: any; token: string }>(
      '/admin/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async getMe() {
    return this.request('/admin/auth/me');
  }

  async logout() {
    const response = await this.request('/admin/auth/logout', { method: 'POST' });
    this.clearToken();
    return response;
  }

  // Stats endpoints
  async getStats() {
    return this.request('/admin/stats/overview');
  }

  // User management endpoints
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isBlocked?: boolean;
    isDeleted?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.search) queryParams.set('search', params.search);
    if (params?.isBlocked !== undefined)
      queryParams.set('isBlocked', params.isBlocked.toString());
    if (params?.isDeleted !== undefined)
      queryParams.set('isDeleted', params.isDeleted.toString());

    const query = queryParams.toString();
    return this.request(`/admin/users${query ? `?${query}` : ''}`);
  }

  async getUserDetails(userId: string) {
    return this.request(`/admin/users/${userId}`);
  }

  async blockUser(userId: string, reason?: string) {
    return this.request(`/admin/users/${userId}/block`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  async unblockUser(userId: string) {
    return this.request(`/admin/users/${userId}/unblock`, {
      method: 'PUT',
    });
  }

  async deleteUser(userId: string, reason?: string) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  }

  // Post moderation endpoints
  async getPosts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.search) queryParams.set('search', params.search);

    const query = queryParams.toString();
    return this.request(`/admin/posts${query ? `?${query}` : ''}`);
  }

  async getPendingPosts() {
    return this.request('/admin/posts/pending');
  }

  async getPostDetails(postId: string) {
    return this.request(`/admin/posts/${postId}`);
  }

  async approvePost(postId: string) {
    return this.request(`/admin/posts/${postId}/approve`, {
      method: 'PUT',
    });
  }

  async rejectPost(postId: string, reason?: string) {
    return this.request(`/admin/posts/${postId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  async deletePost(postId: string, reason?: string) {
    return this.request(`/admin/posts/${postId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  }

  // Flagged posts endpoints
  async getFlaggedPosts(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request(`/admin/posts/flagged/list${query ? `?${query}` : ''}`);
  }

  async getFlaggedPostsCount() {
    return this.request('/admin/posts/flagged/count');
  }

  async getFlaggedPostDetails(postId: string) {
    return this.request(`/admin/posts/flagged/${postId}`);
  }

  async dismissReports(postId: string) {
    return this.request(`/admin/posts/flagged/${postId}/dismiss`, {
      method: 'PUT',
    });
  }

  async deleteFlaggedPost(postId: string, reason?: string) {
    return this.request(`/admin/posts/flagged/${postId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  }

  // Soft delete management endpoints
  async getSoftDeletedPosts(params?: { page?: number; limit?: number; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.search) queryParams.set('search', params.search);

    const query = queryParams.toString();
    return this.request(`/admin/posts/deleted/list${query ? `?${query}` : ''}`);
  }

  async getSoftDeletedPostsCount() {
    return this.request('/admin/posts/deleted/count');
  }

  async softDeletePost(postId: string, reason?: string) {
    return this.request(`/admin/posts/${postId}/soft-delete`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  async restorePost(postId: string) {
    return this.request(`/admin/posts/${postId}/restore`, {
      method: 'PUT',
    });
  }

  async permanentDeletePost(postId: string) {
    return this.request(`/admin/posts/${postId}/permanent`, {
      method: 'DELETE',
    });
  }
}

export const api = new AdminApi();
