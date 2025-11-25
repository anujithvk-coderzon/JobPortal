import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

// Get all users
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      isBlocked,
      isDeleted,
    } = req.query as any;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isBlocked !== undefined) where.isBlocked = isBlocked === 'true';
    if (isDeleted !== undefined) where.isDeleted = isDeleted === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          location: true,
          profilePhoto: true,
          isBlocked: true,
          isDeleted: true,
          deletedAt: true,
          createdAt: true,
          _count: {
            select: {
              jobNews: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
};

// Get user details
export const getUserDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        jobNews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Get user details error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user details',
    });
  }
};

// Block user
export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true },
    });

    // Log action
    await prisma.userAction.create({
      data: {
        userId,
        adminId: req.admin!.adminId,
        action: 'BLOCK',
        reason,
      },
    });

    return res.status(200).json({
      success: true,
      data: user,
      message: 'User blocked successfully',
    });
  } catch (error: any) {
    console.error('Block user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to block user',
    });
  }
};

// Unblock user
export const unblockUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: false },
    });

    // Log action
    await prisma.userAction.create({
      data: {
        userId,
        adminId: req.admin!.adminId,
        action: 'UNBLOCK',
      },
    });

    return res.status(200).json({
      success: true,
      data: user,
      message: 'User unblocked successfully',
    });
  } catch (error: any) {
    console.error('Unblock user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to unblock user',
    });
  }
};

// Delete user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isBlocked: true,
      },
    });

    // Log action
    await prisma.userAction.create({
      data: {
        userId,
        adminId: req.admin!.adminId,
        action: 'DELETE',
        reason,
      },
    });

    return res.status(200).json({
      success: true,
      data: user,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
};
