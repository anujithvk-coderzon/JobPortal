import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

export const getOverviewStats = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      blockedUsers,
      deletedUsers,
      totalPosts,
      pendingPosts,
      approvedPosts,
      rejectedPosts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.user.count({ where: { isDeleted: true } }),
      prisma.jobNews.count(),
      prisma.jobNews.count({ where: { moderationStatus: 'PENDING' } }),
      prisma.jobNews.count({ where: { moderationStatus: 'APPROVED' } }),
      prisma.jobNews.count({ where: { moderationStatus: 'REJECTED' } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: totalUsers - blockedUsers - deletedUsers,
          blocked: blockedUsers,
          deleted: deletedUsers,
        },
        posts: {
          total: totalPosts,
          pending: pendingPosts,
          approved: approvedPosts,
          rejected: rejectedPosts,
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
