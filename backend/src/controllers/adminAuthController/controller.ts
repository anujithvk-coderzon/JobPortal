import { Request, Response } from 'express';
import prisma from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/password';
import {
  generateAdminToken,
  generateAdminRefreshToken,
  verifyAdminRefreshToken,
  rotateAdminRefreshToken,
  revokeAdminRefreshToken,
  revokeAllAdminRefreshTokens,
} from '../../utils/jwt';
import { AuthRequest } from '../../types';
import { asyncWrapper } from '../../middleware/asyncWrapper';
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError } from '../../errors/AppError';

const ADMIN_AUTH_ERRORS = {
  FIELDS_REQUIRED: 'Email, password, and name are required',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long',
  NEW_PASSWORD_TOO_SHORT: 'New password must be at least 6 characters long',
  EMAIL_EXISTS: 'An admin with this email already exists',
  REGISTRATION_CLOSED: 'Admin registration is closed. Contact an existing admin to create your account.',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_DEACTIVATED: 'Your admin account has been deactivated',
  UNAUTHORIZED: 'Unauthorized',
  ADMIN_NOT_FOUND: 'Admin not found',
  PASSWORDS_REQUIRED: 'Current password and new password are required',
  CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect',
  REFRESH_TOKEN_REQUIRED: 'Refresh token is required',
  REFRESH_TOKEN_INVALID: 'Invalid or expired refresh token. Please login again.',
  REFRESH_TOKEN_REUSE: 'Security alert: refresh token reuse detected. All sessions have been logged out.',
  ADMIN_DEACTIVATED: 'Admin account is deactivated.',
} as const;

// Cookie options for admin refresh token
const ADMIN_REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

// Check if setup is needed (any admins exist?)
export const checkAdminSetupStatus = asyncWrapper(async (req: Request, res: Response) => {
  const adminCount = await prisma.admin.count();
  return res.status(200).json({
    success: true,
    data: {
      setupRequired: adminCount === 0,
    },
  });
});

// Register first admin (auto SUPER_ADMIN)
export const adminRegister = asyncWrapper(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    throw new BadRequestError(ADMIN_AUTH_ERRORS.FIELDS_REQUIRED);
  }

  if (password.length < 6) {
    throw new BadRequestError(ADMIN_AUTH_ERRORS.PASSWORD_TOO_SHORT);
  }

  const existingAdmin = await prisma.admin.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    throw new BadRequestError(ADMIN_AUTH_ERRORS.EMAIL_EXISTS);
  }

  // Only allow registration if no admins exist
  const adminCount = await prisma.admin.count();

  if (adminCount > 0) {
    throw new ForbiddenError(ADMIN_AUTH_ERRORS.REGISTRATION_CLOSED);
  }

  const hashedPassword = await hashPassword(password);

  const admin = await prisma.admin.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'SUPER_ADMIN',
    },
  });

  const tokenPayload = {
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  };
  const token = generateAdminToken(tokenPayload);
  const refreshToken = await generateAdminRefreshToken(tokenPayload);

  const { password: _, ...adminWithoutPassword } = admin;

  res.cookie('adminRefreshToken', refreshToken, ADMIN_REFRESH_COOKIE_OPTIONS);

  return res.status(201).json({
    success: true,
    data: {
      admin: adminWithoutPassword,
      token,
    },
    message: 'Admin account created successfully. You are the Super Admin.',
  });
});

// Change admin password
export const changeAdminPassword = asyncWrapper(async (req: AuthRequest, res: Response) => {
  if (!req.admin) {
    throw new UnauthorizedError(ADMIN_AUTH_ERRORS.UNAUTHORIZED);
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new BadRequestError(ADMIN_AUTH_ERRORS.PASSWORDS_REQUIRED);
  }

  if (newPassword.length < 6) {
    throw new BadRequestError(ADMIN_AUTH_ERRORS.NEW_PASSWORD_TOO_SHORT);
  }

  const admin = await prisma.admin.findUnique({
    where: { id: req.admin.adminId },
  });

  if (!admin) {
    throw new NotFoundError(ADMIN_AUTH_ERRORS.ADMIN_NOT_FOUND);
  }

  const isValid = await comparePassword(currentPassword, admin.password);
  if (!isValid) {
    throw new BadRequestError(ADMIN_AUTH_ERRORS.CURRENT_PASSWORD_INCORRECT);
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.admin.update({
    where: { id: req.admin.adminId },
    data: { password: hashedPassword },
  });

  return res.status(200).json({
    success: true,
    message: 'Password updated successfully',
  });
});

// Admin login
export const adminLogin = asyncWrapper(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Email and password are required');
  }

  // Find admin
  const admin = await prisma.admin.findUnique({
    where: { email },
  });

  if (!admin) {
    throw new UnauthorizedError(ADMIN_AUTH_ERRORS.INVALID_CREDENTIALS);
  }

  // Check if admin is active
  if (!admin.isActive) {
    throw new ForbiddenError(ADMIN_AUTH_ERRORS.ACCOUNT_DEACTIVATED);
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, admin.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError(ADMIN_AUTH_ERRORS.INVALID_CREDENTIALS);
  }

  // Update last login
  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLogin: new Date() },
  });

  // Generate tokens
  const tokenPayload = {
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  };
  const token = generateAdminToken(tokenPayload);
  const refreshToken = await generateAdminRefreshToken(tokenPayload);

  // Remove password from response
  const { password: _, ...adminWithoutPassword } = admin;

  res.cookie('adminRefreshToken', refreshToken, ADMIN_REFRESH_COOKIE_OPTIONS);

  return res.status(200).json({
    success: true,
    data: {
      admin: adminWithoutPassword,
      token,
    },
    message: 'Login successful',
  });
});

// Get current admin
export const getMe = asyncWrapper(async (req: AuthRequest, res: Response) => {
  if (!req.admin) {
    throw new UnauthorizedError(ADMIN_AUTH_ERRORS.UNAUTHORIZED);
  }

  const admin = await prisma.admin.findUnique({
    where: { id: req.admin.adminId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
    },
  });

  if (!admin) {
    throw new NotFoundError(ADMIN_AUTH_ERRORS.ADMIN_NOT_FOUND);
  }

  return res.status(200).json({
    success: true,
    data: admin,
  });
});

// Logout (revoke refresh token)
export const logout = asyncWrapper(async (req: AuthRequest, res: Response) => {
  try {
    if (req.admin) {
      const refreshToken = req.cookies?.adminRefreshToken || req.body.refreshToken;
      if (refreshToken) {
        await revokeAdminRefreshToken(refreshToken, req.admin.adminId);
      }
    }

    res.clearCookie('adminRefreshToken', { path: '/' });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.clearCookie('adminRefreshToken', { path: '/' });
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }
});

// Refresh admin access token
export const refreshAdminToken = asyncWrapper(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.adminRefreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw new BadRequestError(ADMIN_AUTH_ERRORS.REFRESH_TOKEN_REQUIRED);
  }

  // Verify the refresh token (extracts adminId from stored data)
  const payload = await verifyAdminRefreshToken(refreshToken);

  if (!payload) {
    return res.status(401).json({
      success: false,
      error: ADMIN_AUTH_ERRORS.REFRESH_TOKEN_INVALID,
      code: 'REFRESH_TOKEN_INVALID',
    });
  }

  // Check if admin is still active
  const admin = await prisma.admin.findUnique({
    where: { id: payload.adminId },
    select: { id: true, email: true, role: true, isActive: true },
  });

  if (!admin || !admin.isActive) {
    await revokeAllAdminRefreshTokens(payload.adminId);
    throw new ForbiddenError(ADMIN_AUTH_ERRORS.ADMIN_DEACTIVATED);
  }

  // Rotate refresh token
  const tokenPayload = { adminId: admin.id, email: admin.email, role: admin.role };
  const newRefreshToken = await rotateAdminRefreshToken(refreshToken, tokenPayload);

  if (!newRefreshToken) {
    return res.status(401).json({
      success: false,
      error: ADMIN_AUTH_ERRORS.REFRESH_TOKEN_REUSE,
      code: 'REFRESH_TOKEN_REUSE',
    });
  }

  const newAccessToken = generateAdminToken(tokenPayload);

  res.cookie('adminRefreshToken', newRefreshToken, ADMIN_REFRESH_COOKIE_OPTIONS);

  return res.status(200).json({
    success: true,
    data: {
      token: newAccessToken,
    },
  });
});
