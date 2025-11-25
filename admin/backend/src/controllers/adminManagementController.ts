import { Response } from 'express';
import prisma from '../config/database';
import { hashPassword } from '../utils/password';
import { AuthRequest } from '../types';

// Create new admin (only SUPER_ADMIN can create)
export const createNewAdmin = async (req: AuthRequest, res: Response) => {
  try {
    // Check if requesting admin is SUPER_ADMIN
    if (!req.admin || req.admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only Super Admins can create new admin accounts',
      });
    }

    const { email, password, name, role } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required',
      });
    }

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Admin with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new admin
    const newAdmin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role === 'MODERATOR' ? 'MODERATOR' : 'MODERATOR', // Default to MODERATOR, only SUPER_ADMIN via script
      },
    });

    // Remove password from response
    const { password: _, ...adminWithoutPassword } = newAdmin;

    return res.status(201).json({
      success: true,
      data: adminWithoutPassword,
      message: 'Admin created successfully',
    });
  } catch (error: any) {
    console.error('Create admin error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create admin',
    });
  }
};

// Get all admins (only SUPER_ADMIN can view)
export const getAllAdmins = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin || req.admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only Super Admins can view all admins',
      });
    }

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: admins,
    });
  } catch (error: any) {
    console.error('Get admins error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch admins',
    });
  }
};

// Deactivate admin (only SUPER_ADMIN can deactivate)
export const deactivateAdmin = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin || req.admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only Super Admins can deactivate admins',
      });
    }

    const { adminId } = req.params;

    // Prevent self-deactivation
    if (adminId === req.admin.adminId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot deactivate your own account',
      });
    }

    const admin = await prisma.admin.update({
      where: { id: adminId },
      data: { isActive: false },
    });

    return res.status(200).json({
      success: true,
      data: admin,
      message: 'Admin deactivated successfully',
    });
  } catch (error: any) {
    console.error('Deactivate admin error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to deactivate admin',
    });
  }
};

// Activate admin (only SUPER_ADMIN can activate)
export const activateAdmin = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin || req.admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only Super Admins can activate admins',
      });
    }

    const { adminId } = req.params;

    const admin = await prisma.admin.update({
      where: { id: adminId },
      data: { isActive: true },
    });

    return res.status(200).json({
      success: true,
      data: admin,
      message: 'Admin activated successfully',
    });
  } catch (error: any) {
    console.error('Activate admin error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to activate admin',
    });
  }
};
