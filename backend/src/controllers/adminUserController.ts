import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const isBlocked = req.query.isBlocked === 'true';
    const isDeleted = req.query.isDeleted === 'true';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      // Exclude deleted users by default
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isBlocked) {
      where.isBlocked = true;
    }

    // Allow viewing deleted users only if explicitly requested
    if (isDeleted) {
      where.isDeleted = true;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
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
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
};

export const getUserDetails = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        jobNews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            jobNews: true,
            applications: true,
          },
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

export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { userId } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true },
    });

    // Log the action
    await prisma.userAction.create({
      data: {
        userId,
        adminId: req.admin.adminId,
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

export const unblockUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { userId } = req.params;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isBlocked: false },
    });

    // Log the action
    await prisma.userAction.create({
      data: {
        userId,
        adminId: req.admin.adminId,
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

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const { userId } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Log the action
    await prisma.userAction.create({
      data: {
        userId,
        adminId: req.admin.adminId,
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
