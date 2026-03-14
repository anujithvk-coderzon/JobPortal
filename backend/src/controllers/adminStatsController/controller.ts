import { Response } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { cacheGet, TTL, CacheKeys } from '../../utils/cache';
import { asyncWrapper } from '../../middleware/asyncWrapper';
import { UnauthorizedError } from '../../errors/AppError';

const ERRORS = {
  UNAUTHORIZED: 'Unauthorized',
} as const;

export const getStats = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.admin) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

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
});
