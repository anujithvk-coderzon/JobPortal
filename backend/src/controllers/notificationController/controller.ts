import { Response } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';
import { cacheGet, cacheInvalidate, TTL, CacheKeys } from '../../utils/cache';
import { asyncWrapper } from '../../middleware/asyncWrapper';
import { UnauthorizedError } from '../../errors/AppError';

const ERRORS = {
  UNAUTHORIZED: 'Unauthorized',
} as const;

export const getNotifications = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const notifications = await prisma.notification.findMany({
    where: {
      userId: req.user.userId,
      isRead: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json({
    success: true,
    data: notifications,
  });
});

export const markAsRead = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const { notificationId } = req.params;

  await prisma.notification.delete({
    where: {
      id: notificationId,
      userId: req.user.userId,
    },
  });

  await cacheInvalidate(CacheKeys.unreadCount(req.user.userId));

  return res.status(200).json({
    success: true,
    message: 'Notification deleted successfully',
  });
});

export const getUnreadCount = asyncWrapper(async function (req: AuthRequest, res: Response) {
  if (!req.user) throw new UnauthorizedError(ERRORS.UNAUTHORIZED);

  const userId = req.user.userId;
  const count = await cacheGet(
    CacheKeys.unreadCount(userId),
    () => prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    }),
    TTL.SHORT
  );

  return res.status(200).json({
    success: true,
    data: { count },
  });
});
