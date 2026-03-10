import { Response } from 'express';
import prisma from '../config/database';
import { hashPassword } from '../utils/password';
import { AuthRequest } from '../types';

// Create new admin (only SUPER_ADMIN can create)
export const createNewAdmin = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin || req.admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only Super Admins can create new admin accounts',
      });
    }

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
        error: 'Admin with this email already exists',
      });
    }

    const hashedPassword = await hashPassword(password);

    const newAdmin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'MODERATOR',
      },
    });

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

// Get all admins
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

// Deactivate admin
export const deactivateAdmin = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin || req.admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only Super Admins can deactivate admins',
      });
    }

    const { adminId } = req.params;

    // Cannot deactivate yourself
    if (adminId === req.admin.adminId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot deactivate your own account',
      });
    }

    // Check target admin's role - cannot deactivate another SUPER_ADMIN
    const targetAdmin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found',
      });
    }

    if (targetAdmin.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Cannot deactivate a Super Admin account',
      });
    }

    const admin = await prisma.admin.update({
      where: { id: adminId },
      data: { isActive: false },
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

// Delete admin (only moderators can be deleted)
export const deleteAdmin = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin || req.admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Only Super Admins can delete admins',
      });
    }

    const { adminId } = req.params;

    if (adminId === req.admin.adminId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
      });
    }

    const targetAdmin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (!targetAdmin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found',
      });
    }

    if (targetAdmin.role === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete a Super Admin account',
      });
    }

    await prisma.admin.delete({
      where: { id: adminId },
    });

    return res.status(200).json({
      success: true,
      message: 'Admin deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete admin error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete admin',
    });
  }
};

// Activate admin
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
