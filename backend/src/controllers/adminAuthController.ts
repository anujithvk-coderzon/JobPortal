import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import {
  generateAdminToken,
  generateAdminRefreshToken,
  verifyAdminRefreshToken,
  rotateAdminRefreshToken,
  revokeAdminRefreshToken,
  revokeAllAdminRefreshTokens,
} from '../utils/jwt';
import { AuthRequest } from '../types';

// Cookie options for admin refresh token
const ADMIN_REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

// Check if setup is needed (any admins exist?)
export const checkAdminSetupStatus = async (req: Request, res: Response) => {
  try {
    const adminCount = await prisma.admin.count();
    return res.status(200).json({
      success: true,
      data: {
        setupRequired: adminCount === 0,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to check setup status',
    });
  }
};

// Register first admin (auto SUPER_ADMIN)
export const adminRegister = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
      });
    }

    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'An admin with this email already exists',
      });
    }

    // Only allow registration if no admins exist
    const adminCount = await prisma.admin.count();

    if (adminCount > 0) {
      return res.status(403).json({
        success: false,
        error: 'Admin registration is closed. Contact an existing admin to create your account.',
      });
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
  } catch (error: any) {
    console.error('Admin register error:', error);
    return res.status(500).json({
      success: false,
      error: 'Registration failed',
    });
  }
};

// Change admin password
export const changeAdminPassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long',
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.adminId },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found',
      });
    }

    const isValid = await comparePassword(currentPassword, admin.password);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect',
      });
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
  } catch (error: any) {
    console.error('Change admin password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to change password',
    });
  }
};

// Admin login
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Your admin account has been deactivated',
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
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
  } catch (error: any) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
};

// Get current admin
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
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
      return res.status(404).json({
        success: false,
        error: 'Admin not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error: any) {
    console.error('Get admin error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch admin data',
    });
  }
};

// Logout (revoke refresh token)
export const logout = async (req: AuthRequest, res: Response) => {
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
};

// Refresh admin access token
export const refreshAdminToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.adminRefreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    // Verify the refresh token (extracts adminId from stored data)
    const payload = await verifyAdminRefreshToken(refreshToken);

    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token. Please login again.',
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
      return res.status(403).json({
        success: false,
        error: 'Admin account is deactivated.',
      });
    }

    // Rotate refresh token
    const tokenPayload = { adminId: admin.id, email: admin.email, role: admin.role };
    const newRefreshToken = await rotateAdminRefreshToken(refreshToken, tokenPayload);

    if (!newRefreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Security alert: refresh token reuse detected. All sessions have been logged out.',
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
  } catch (error: any) {
    console.error('Admin refresh token error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to refresh token',
    });
  }
};
