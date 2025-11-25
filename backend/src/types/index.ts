import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
  admin?: {
    adminId: string;
    email: string;
    role: 'SUPER_ADMIN' | 'MODERATOR';
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams extends PaginationParams {
  search?: string;
  location?: string;
  employmentType?: string;
  experienceLevel?: string;
  locationType?: string;
  salaryMin?: number;
  salaryMax?: number;
  sortBy?: 'recent' | 'salary' | 'relevance';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
