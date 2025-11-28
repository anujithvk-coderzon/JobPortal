import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Get user statistics
    const [totalUsers, activeUsers, blockedUsers, deletedUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBlocked: false, isDeleted: false } }),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.user.count({ where: { isDeleted: true } }),
    ]);

    // Get post statistics
    const [totalPosts, pendingPosts, approvedPosts] = await Promise.all([
      prisma.jobNews.count(),
      prisma.jobNews.count({ where: { moderationStatus: 'PENDING' } }),
      prisma.jobNews.count({ where: { moderationStatus: 'APPROVED' } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          blocked: blockedUsers,
          deleted: deletedUsers,
        },
        posts: {
          total: totalPosts,
          pending: pendingPosts,
          approved: approvedPosts,
        },
      },
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
};
