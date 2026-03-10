import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { cacheGet, TTL, CacheKeys } from '../utils/cache';

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const stats = await cacheGet(
      CacheKeys.adminStats(),
      async () => {
        const [totalUsers, activeUsers, blockedUsers, deletedUsers] = await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { isBlocked: false, isDeleted: false } }),
          prisma.user.count({ where: { isBlocked: true } }),
          prisma.user.count({ where: { isDeleted: true } }),
        ]);

        const [totalPosts, pendingPosts, approvedPosts] = await Promise.all([
          prisma.jobNews.count(),
          prisma.jobNews.count({ where: { moderationStatus: 'PENDING' } }),
          prisma.jobNews.count({ where: { moderationStatus: 'APPROVED' } }),
        ]);

        return {
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
        };
      },
      TTL.VERY_LONG
    );

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
};
