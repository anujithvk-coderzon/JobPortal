import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../types';

// Register admin (first admin becomes SUPER_ADMIN automatically)
export const register = async (req: Request, res: Response) => {
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

    // Check if admin with this email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'An admin with this email already exists',
      });
    }

    // Check if any admins exist — first one becomes SUPER_ADMIN
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

    // Generate token
    const token = generateToken({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    });

    const { password: _, ...adminWithoutPassword } = admin;

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

// Check if setup is needed (any admins exist?)
export const checkSetupStatus = async (req: Request, res: Response) => {
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

// Admin login
export const login = async (req: Request, res: Response) => {
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

    // Generate token
    const token = generateToken({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    });

    // Remove password from response
    const { password: _, ...adminWithoutPassword } = admin;

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

// Logout (client-side token removal, just for consistency)
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
};
