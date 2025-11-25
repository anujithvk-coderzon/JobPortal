import { Request } from 'express';

export interface AuthRequest extends Request {
  admin?: {
    adminId: string;
    email: string;
    role: 'SUPER_ADMIN' | 'MODERATOR';
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
